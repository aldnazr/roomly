import type { DbPaymentRow, PaymentDTO } from "../types";

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
