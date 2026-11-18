import type { AuthUser } from "../../auth/middleware";
import { newId } from "../../ids";
import type { Clock } from "../../shared/application/infrastructure-ports";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/domain/errors";
import type {
  BankCode,
  DbPaymentRow,
  PaymentMethod,
  PaymentProvider,
} from "../types";
import { toPaymentDTO } from "./mappers";
import type { PaymentRepository } from "./ports";

export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly providerFactory: (nowFn: () => Date) => PaymentProvider,
    private readonly clock: Clock,
  ) {}

  private now() {
    return this.clock.now();
  }

  async verifyReservationAccess(reservationId: string, user: AuthUser) {
    const res = await this.repository.getReservation(reservationId);
    if (!res) throw new NotFoundError("Reservation not found");

    if (this.repository.isStaffOrAdmin(user.role)) {
      return res;
    }

    const userRow = await this.repository.getUserEmail(user.id);
    const guestRow = await this.repository.getGuestEmail(res.guest_id);

    const isOwner =
      res.guest_id === user.id ||
      (!!userRow &&
        !!guestRow &&
        userRow.toLowerCase() === guestRow.toLowerCase());

    if (!isOwner) throw new ForbiddenError("Access denied to this reservation");
    return res;
  }

  async transitionPayment(
    paymentId: string,
    newStatus: "paid" | "failed" | "expired",
  ): Promise<DbPaymentRow> {
    const now = this.now();
    const nowIso = now.toISOString();

    const payment = await this.repository.getPaymentById(paymentId);
    if (!payment) throw new NotFoundError("Payment not found");

    if (payment.status !== "pending") {
      return payment;
    }

    const paidAt = newStatus === "paid" ? nowIso : null;

    const affected = await this.repository.updatePaymentStatus(
      paymentId,
      newStatus,
      nowIso,
      paidAt,
    );
    if (affected === 0) {
      const reFetch = await this.repository.getPaymentById(paymentId);
      if (reFetch) return reFetch;
      throw new NotFoundError("Payment not found");
    }

    if (newStatus === "paid") {
      await this.repository.updateReservationOnPaid(
        payment.reservation_id,
        nowIso,
      );
    } else if (newStatus === "expired") {
      const otherPending = await this.repository.countOtherPendingPayments(
        payment.reservation_id,
        paymentId,
      );
      if (otherPending === 0) {
        await this.repository.cancelReservation(payment.reservation_id);
      }
    }

    const updated = await this.repository.getPaymentById(paymentId);
    return updated!;
  }

  async getPayment(paymentId: string, user: AuthUser) {
    const payment = await this.repository.getPaymentById(paymentId);
    if (!payment) throw new NotFoundError("Payment not found");

    await this.verifyReservationAccess(String(payment.reservation_id), user);

    const now = this.now();
    const nowIso = now.toISOString();

    if (payment.status === "pending" && payment.expires_at <= nowIso) {
      const expiredPayment = await this.transitionPayment(
        payment.id,
        "expired",
      );
      return toPaymentDTO(expiredPayment, now);
    }

    return toPaymentDTO(payment, now);
  }

  async createPayment(
    input: {
      reservationId: string;
      method: PaymentMethod;
      bank?: BankCode;
    },
    user: AuthUser,
  ) {
    if (input.method === "va" && !input.bank) {
      throw new ValidationError("Bank is required for VA payment method");
    }
    if (input.method === "qris" && input.bank) {
      throw new ValidationError("Bank is not allowed for QRIS payment method");
    }

    const reservation = await this.verifyReservationAccess(
      input.reservationId,
      user,
    );

    if (reservation.status !== "pending_payment") {
      throw new ConflictError("Reservation is not in a payable status");
    }

    const now = this.now();
    const nowIso = now.toISOString();

    const pendingPayments = await this.repository.listPendingPayments(
      input.reservationId,
    );

    for (const p of pendingPayments) {
      if (p.expires_at <= nowIso) {
        await this.transitionPayment(p.id, "expired");
      } else if (
        p.method === input.method &&
        (input.method !== "va" || p.bank === input.bank)
      ) {
        return toPaymentDTO(p, now);
      }
    }

    const attempts = await this.repository.countPayments(input.reservationId);
    const maxAttempts = Number(process.env.PAYMENT_MAX_ATTEMPTS || "3");
    if (attempts >= maxAttempts) {
      throw new ConflictError(
        "Maximum payment attempts reached for this reservation",
      );
    }

    const provider = this.providerFactory(() => now);
    const providerRes = await provider.createPayment({
      reservationId: input.reservationId,
      amount: reservation.total_price,
      method: input.method,
      bank: input.bank,
    });

    const paymentId = newId();

    const created = await this.repository.createPayment({
      id: paymentId,
      reservationId: input.reservationId,
      amount: reservation.total_price,
      method: input.method,
      bank: input.bank ?? null,
      providerRef: providerRes.providerRef,
      vaNumber: providerRes.vaNumber ?? null,
      qrString: providerRes.qrString ?? null,
      expiresAt: providerRes.expiresAt.toISOString(),
      nowIso,
    });

    return toPaymentDTO(created, now);
  }

  async getPaymentRow(id: string) {
    return this.repository.getPaymentById(id);
  }

  async getPaymentByProviderRef(providerRef: string) {
    return this.repository.getPaymentByProviderRef(providerRef);
  }
  async expireStalePayments() {
    const nowIso = this.now().toISOString();
    const stales = await this.repository.listStalePayments(nowIso);
    for (const s of stales) {
      await this.transitionPayment(s.id, "expired");
    }
    return stales.length;
  }
}
