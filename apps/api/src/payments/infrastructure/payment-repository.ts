import { db, query, queryOne } from "../../db";
import type { PaymentRepository } from "../application/ports";
import type { DbPaymentRow } from "../types";

export class LibsqlPaymentRepository implements PaymentRepository {
  async getReservation(id: string) {
    return queryOne<{
      id: string;
      guest_id: number;
      total_price: number;
      status: string;
    }>(
      "SELECT id, guest_id, total_price, status FROM reservations WHERE id = ?",
      [id],
    );
  }

  async getUserEmail(userId: number) {
    const row = await queryOne<{ email: string }>(
      "SELECT email FROM users WHERE id = ?",
      [userId],
    );
    return row?.email ?? null;
  }

  async getGuestEmail(guestId: number) {
    const row = await queryOne<{ email: string }>(
      "SELECT email FROM guests WHERE id = ?",
      [guestId],
    );
    return row?.email ?? null;
  }

  async getPaymentById(id: string) {
    return queryOne<DbPaymentRow>("SELECT * FROM payments WHERE id = ?", [id]);
  }

  async getPaymentByProviderRef(providerRef: string) {
    return queryOne<DbPaymentRow>(
      "SELECT * FROM payments WHERE provider_ref = ?",
      [providerRef],
    );
  }

  async listPendingPayments(reservationId: string) {
    return query<DbPaymentRow>(
      "SELECT * FROM payments WHERE reservation_id = ? AND status = 'pending'",
      [reservationId],
    );
  }

  async countPayments(reservationId: string) {
    const row = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM payments WHERE reservation_id = ?",
      [reservationId],
    );
    return row?.count ?? 0;
  }

  async createPayment(input: {
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
  }) {
    await db.execute({
      sql: `INSERT INTO payments (
        id, reservation_id, amount, method, bank, status, provider_ref, va_number, qr_string, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      args: [
        input.id,
        input.reservationId,
        input.amount,
        input.method,
        input.bank,
        input.providerRef,
        input.vaNumber,
        input.qrString,
        input.expiresAt,
        input.nowIso,
        input.nowIso,
      ],
    });
    const created = await this.getPaymentById(input.id);
    return created!;
  }

  async updatePaymentStatus(
    id: string,
    newStatus: "paid" | "failed" | "expired",
    nowIso: string,
    paidAt: string | null,
  ) {
    const result = await db.execute({
      sql: "UPDATE payments SET status = ?, updated_at = ?, paid_at = COALESCE(?, paid_at) WHERE id = ? AND status = 'pending'",
      args: [newStatus, nowIso, paidAt, id],
    });
    return result.rowsAffected;
  }

  async updateReservationOnPaid(reservationId: string, paidAt: string) {
    await db.execute({
      sql: "UPDATE reservations SET status = 'confirmed', paid_at = ? WHERE id = ?",
      args: [paidAt, reservationId],
    });
  }

  async countOtherPendingPayments(reservationId: string, paymentId: string) {
    const row = await queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM payments WHERE reservation_id = ? AND status = 'pending' AND id != ?",
      [reservationId, paymentId],
    );
    return row?.count ?? 0;
  }

  async cancelReservation(reservationId: string) {
    await db.execute({
      sql: "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
      args: [reservationId],
    });
  }

  async listStalePayments(nowIso: string) {
    return query<{ id: string }>(
      "SELECT id FROM payments WHERE status = 'pending' AND expires_at <= ?",
      [nowIso],
    );
  }

  isStaffOrAdmin(role: string): boolean {
    return ["staff", "manager", "admin"].includes(role);
  }
}
