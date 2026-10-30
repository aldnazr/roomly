import { db, query, queryOne } from "../db";
import { HttpError } from "../errors";
import { newId } from "../ids";
import type { AuthUser } from "../auth/middleware";
import { getPaymentProvider } from "./provider";
import type { BankCode, DbPaymentRow, PaymentDTO, PaymentMethod, PaymentStatus } from "./types";

function isStaffOrAdmin(role: string): boolean {
  return ["staff", "manager", "admin"].includes(role);
}

async function verifyReservationAccess(reservationId: string, user: AuthUser): Promise<{ id: string; guest_id: number; total_price: number; status: string }> {
  const res = await queryOne<{ id: string; guest_id: number; total_price: number; status: string }>(
    "SELECT id, guest_id, total_price, status FROM reservations WHERE id = ?",
    [reservationId],
  );

  if (!res) {
    throw new HttpError(404, "Reservation not found");
  }

  if (isStaffOrAdmin(user.role)) {
    return res;
  }

  // Check if user owns reservation (by user id matching guest_id or matching guest email)
  const userRow = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = ?", [user.id]);
  const guestRow = await queryOne<{ email: string }>("SELECT email FROM guests WHERE id = ?", [res.guest_id]);

  const isOwner =
    res.guest_id === user.id ||
    (userRow && guestRow && userRow.email.toLowerCase() === guestRow.email.toLowerCase());

  if (!isOwner) {
    throw new HttpError(403, "Access denied to this reservation");
  }

  return res;
}

export function toPaymentDTO(row: DbPaymentRow, now: Date): PaymentDTO {
  const expiresDate = new Date(row.expires_at);
  const isPending = row.status === "pending";
  const remainingSeconds = isPending ? Math.max(0, Math.floor((expiresDate.getTime() - now.getTime()) / 1000)) : 0;

  return {
    id: row.id,
    reservation_id: String(row.reservation_id),
    amount: row.amount,
    currency: "IDR",
    method: row.method,
    bank: row.bank,
    status: row.status,
    va_number: row.va_number,
    qr_string: row.qr_string,
    expires_at: row.expires_at,
    server_time: now.toISOString(),
    remaining_seconds: remainingSeconds,
    paid_at: row.paid_at,
  };
}

export async function transitionPayment(
  paymentId: string,
  newStatus: "paid" | "failed" | "expired",
  nowFn: () => Date = () => new Date(),
): Promise<DbPaymentRow> {
  const now = nowFn();
  const nowIso = now.toISOString();

  const payment = await queryOne<DbPaymentRow>("SELECT * FROM payments WHERE id = ?", [paymentId]);
  if (!payment) {
    throw new HttpError(404, "Payment not found");
  }

  // Terminal state - idempotent
  if (payment.status !== "pending") {
    return payment;
  }

  const paidAt = newStatus === "paid" ? nowIso : null;

  const result = await db.execute({
    sql: "UPDATE payments SET status = ?, updated_at = ?, paid_at = COALESCE(?, paid_at) WHERE id = ? AND status = 'pending'",
    args: [newStatus, nowIso, paidAt, paymentId],
  });

  if (result.rowsAffected === 0) {
    const reFetch = await queryOne<DbPaymentRow>("SELECT * FROM payments WHERE id = ?", [paymentId]);
    if (reFetch) return reFetch;
    throw new HttpError(404, "Payment not found");
  }

  // Handle side effect on reservation
  if (newStatus === "paid") {
    await db.execute({
      sql: "UPDATE reservations SET status = 'confirmed', paid_at = ? WHERE id = ?",
      args: [nowIso, payment.reservation_id],
    });
  } else if (newStatus === "expired") {
    const otherPending = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM payments WHERE reservation_id = ? AND status = 'pending' AND id != ?",
      [payment.reservation_id, paymentId],
    );

    if (!otherPending || otherPending.count === 0) {
      await db.execute({
        sql: "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
        args: [payment.reservation_id],
      });
    }
  }

  const updated = await queryOne<DbPaymentRow>("SELECT * FROM payments WHERE id = ?", [paymentId]);
  return updated!;
}

export async function getPayment(
  paymentId: string,
  user: AuthUser,
  nowFn: () => Date = () => new Date(),
): Promise<PaymentDTO> {
  const payment = await queryOne<DbPaymentRow>("SELECT * FROM payments WHERE id = ?", [paymentId]);
  if (!payment) {
    throw new HttpError(404, "Payment not found");
  }

  await verifyReservationAccess(String(payment.reservation_id), user);

  const now = nowFn();
  const nowIso = now.toISOString();

  // Lazy expiry
  if (payment.status === "pending" && payment.expires_at <= nowIso) {
    const expiredPayment = await transitionPayment(payment.id, "expired", nowFn);
    return toPaymentDTO(expiredPayment, now);
  }

  return toPaymentDTO(payment, now);
}

export async function createPayment(
  input: {
    reservationId: string;
    method: PaymentMethod;
    bank?: BankCode;
  },
  user: AuthUser,
  nowFn: () => Date = () => new Date(),
): Promise<PaymentDTO> {
  if (input.method === "va" && !input.bank) {
    throw new HttpError(400, "Bank is required for VA payment method");
  }
  if (input.method === "qris" && input.bank) {
    throw new HttpError(400, "Bank is not allowed for QRIS payment method");
  }

  const reservation = await verifyReservationAccess(input.reservationId, user);

  if (reservation.status !== "pending_payment") {
    throw new HttpError(409, "Reservation is not in a payable status");
  }

  const now = nowFn();
  const nowIso = now.toISOString();

  // Check pending payments for this reservation and handle lazy expiry
  const pendingPayments = await query<DbPaymentRow>(
    "SELECT * FROM payments WHERE reservation_id = ? AND status = 'pending'",
    [input.reservationId],
  );

  for (const p of pendingPayments) {
    if (p.expires_at <= nowIso) {
      await transitionPayment(p.id, "expired", nowFn);
    } else if (p.method === input.method && (input.method !== "va" || p.bank === input.bank)) {
      // Idempotent return of existing active pending payment
      return toPaymentDTO(p, now);
    }
  }

  // Check attempt limit
  const attempts = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM payments WHERE reservation_id = ?",
    [input.reservationId],
  );

  const maxAttempts = Number(process.env.PAYMENT_MAX_ATTEMPTS || "3");
  if (attempts && attempts.count >= maxAttempts) {
    throw new HttpError(409, "Maximum payment attempts reached for this reservation");
  }

  const provider = getPaymentProvider(nowFn);
  const providerRes = await provider.createPayment({
    reservationId: input.reservationId,
    amount: reservation.total_price,
    method: input.method,
    bank: input.bank,
  });

  const paymentId = newId();

  await db.execute({
    sql: `INSERT INTO payments (
      id, reservation_id, amount, method, bank, status, provider_ref, va_number, qr_string, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
    args: [
      paymentId,
      input.reservationId,
      reservation.total_price,
      input.method,
      input.bank ?? null,
      providerRes.providerRef,
      providerRes.vaNumber ?? null,
      providerRes.qrString ?? null,
      providerRes.expiresAt.toISOString(),
      nowIso,
      nowIso,
    ],
  });

  const created = await queryOne<DbPaymentRow>("SELECT * FROM payments WHERE id = ?", [paymentId]);
  return toPaymentDTO(created!, now);
}

export async function expireStalePayments(
  nowFn: () => Date = () => new Date(),
): Promise<number> {
  const nowIso = nowFn().toISOString();
  const stales = await query<{ id: string }>(
    "SELECT id FROM payments WHERE status = 'pending' AND expires_at <= ?",
    [nowIso],
  );

  for (const s of stales) {
    await transitionPayment(s.id, "expired", nowFn);
  }

  return stales.length;
}
