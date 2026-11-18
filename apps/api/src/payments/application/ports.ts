import type { DbPaymentRow } from "../types";

export interface PaymentRepository {
  getReservation(id: string): Promise<{ id: string; guest_id: number; total_price: number; status: string } | null>;
  getUserEmail(userId: number): Promise<string | null>;
  getGuestEmail(guestId: number): Promise<string | null>;
  getPaymentById(id: string): Promise<DbPaymentRow | null>;
  getPaymentByProviderRef(providerRef: string): Promise<DbPaymentRow | null>;
  listPendingPayments(reservationId: string): Promise<DbPaymentRow[]>;
  countPayments(reservationId: string): Promise<number>;
  createPayment(input: {
    id: string;
    reservationId: string;
    amount: number;
    method: DbPaymentRow["method"];
    bank: DbPaymentRow["bank"];
    providerRef: string;
    vaNumber: string | null;
    qrString: string | null;
    expiresAt: string;
    nowIso: string;
  }): Promise<DbPaymentRow>;
  updatePaymentStatus(id: string, newStatus: "paid" | "failed" | "expired", nowIso: string, paidAt: string | null): Promise<number>;
  updateReservationOnPaid(reservationId: string, paidAt: string): Promise<void>;
  countOtherPendingPayments(reservationId: string, paymentId: string): Promise<number>;
  cancelReservation(reservationId: string): Promise<void>;
  listStalePayments(nowIso: string): Promise<{ id: string }[]>;
  isStaffOrAdmin(role: string): boolean;
}