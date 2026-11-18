import { db, query, queryOne } from "../db";
import type { ReservationRepository, ReservationHistoryRow } from "./application/ports";

const BASE = `
  SELECT
    r.id AS id,
    r.guest_id AS guest_id,
    g.name AS guest_name,
    g.email AS guest_email,
    g.phone AS guest_phone,
    r.room_type_id AS room_type_id,
    rt.name AS room_type_name,
    r.room_id AS room_id,
    rm.room_number AS room_number,
    r.check_in AS check_in,
    r.check_out AS check_out,
    r.status AS status,
    r.total_price AS total_price,
    r.paid_at AS paid_at
  FROM reservations r
  LEFT JOIN guests g ON g.id = r.guest_id
  LEFT JOIN room_types rt ON rt.id = r.room_type_id
  LEFT JOIN rooms rm ON rm.id = r.room_id
`;

export class LibsqlReservationRepository implements ReservationRepository {
  async getUserAccount(userId: number) {
    return queryOne<{ name: string; email: string }>("SELECT name, email FROM users WHERE id = ?", [userId]);
  }

  async findGuestByEmail(email: string) {
    return queryOne<{ id: number }>("SELECT id FROM guests WHERE email = ? COLLATE NOCASE ORDER BY id ASC LIMIT 1", [email]);
  }

  async createGuest(name: string, email: string) {
    return queryOne<{ id: number }>("INSERT INTO guests (name, email) VALUES (?, ?) RETURNING id", [name, email]) as Promise<{ id: number }>;
  }

  async findAvailableRoom(roomTypeId: string, checkOut: string, checkIn: string) {
    return queryOne<{ id: string }>(
      `SELECT r.id
       FROM rooms r
       WHERE r.room_type_id = ?
         AND r.status <> 'maintenance'
         AND NOT EXISTS (
           SELECT 1 FROM reservations reservation
           WHERE reservation.room_id = r.id
             AND reservation.status IN ('pending', 'pending_payment', 'confirmed', 'checked_in')
             AND reservation.check_in < ?
             AND reservation.check_out > ?
         )
       ORDER BY r.room_number ASC
       LIMIT 1`,
      [roomTypeId, checkOut, checkIn],
    );
  }

  async createCheckoutReservation(input: {
    guestId: number;
    roomTypeId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
  }) {
    return queryOne<{
      id: number;
      room_type_id: string;
      check_in: string;
      check_out: string;
      total_price: number;
      status: string;
    }>(
      `INSERT INTO reservations
         (guest_id, room_type_id, room_id, check_in, check_out, status, total_price, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, datetime('now'))
       RETURNING id, room_type_id, check_in, check_out, total_price, status`,
      [input.guestId, input.roomTypeId, input.roomId, input.checkIn, input.checkOut, input.totalPrice],
    ) as any;
  }

  async listReservationsByEmail(email: string) {
    const rows = await query<ReservationHistoryRow>(
      `${BASE} WHERE r.guest_id IN (SELECT g.id FROM guests g WHERE g.email = ? COLLATE NOCASE)
         AND (r.paid_at IS NOT NULL OR EXISTS (SELECT 1 FROM payments pay WHERE pay.reservation_id = r.id AND pay.status = 'paid'))
       ORDER BY r.id ASC`,
      [email],
    );
    return rows;
  }

  async getReservationById(id: number) {
    return queryOne<ReservationHistoryRow>(`${BASE} WHERE r.id = ?`, [id]);
  }

  async getUserEmail(userId: number) {
    const row = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = ?", [userId]);
    return row?.email ?? null;
  }

  async getGuestEmail(guestId: number | null) {
    if (guestId === null) return null;
    const row = await queryOne<{ email: string | null }>("SELECT email FROM guests WHERE id = ?", [guestId]);
    return row?.email ?? null;
  }

  async hasPermission(role: string, slug: string) {
    const row = await queryOne<{ granted: number }>(
      `SELECT 1 AS granted
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE r.slug = ? AND p.slug = ?`,
      [role, slug],
    );
    return !!row;
  }

  async listCheckIns(date: string) {
    return query<ReservationHistoryRow>(
      `${BASE} WHERE r.check_in = ? AND r.status IN ('confirmed', 'pending_payment') ORDER BY r.id DESC`,
      [date],
    );
  }

  async listCheckOuts(date: string) {
    return query<ReservationHistoryRow>(
      `${BASE} WHERE r.check_out = ? AND r.status = 'checked_in' ORDER BY r.id DESC`,
      [date],
    );
  }

  async getRoomStats() {
    const row = await queryOne<{ occupied_rooms: number; available_rooms: number }>(
      "SELECT (SELECT COUNT(*) FROM rooms WHERE status = 'occupied') AS occupied_rooms, (SELECT COUNT(*) FROM rooms WHERE status = 'available') AS available_rooms",
    );
    return row ?? { occupied_rooms: 0, available_rooms: 0 };
  }

  async cancelReservation(id: number) {
    return queryOne<{ id: number; status: string }>(
      `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = ?
         AND status IN ('pending', 'pending_payment', 'confirmed')
       RETURNING id, status`,
      [id],
    );
  }

  async getReservationForCheckIn(id: number) {
    return queryOne<{ id: number; room_id: string | null; status: string }>(
      "SELECT id, room_id, status FROM reservations WHERE id = ?",
      [id],
    );
  }

  async setCheckedIn(id: number, roomId: string) {
    await queryOne<{ id: number }>(
      "UPDATE reservations SET status = 'checked_in' WHERE id = ? AND status = 'confirmed' RETURNING id",
      [id],
    );
    await db.execute({ sql: "UPDATE rooms SET status = 'occupied' WHERE id = ?", args: [roomId] });
  }

  async getReservationForCheckOut(id: number) {
    return queryOne<{ id: number; room_id: string | null; status: string }>(
      "SELECT id, room_id, status FROM reservations WHERE id = ?",
      [id],
    );
  }

  async setCheckedOut(id: number, roomId: string | null) {
    await queryOne<{ id: number }>(
      "UPDATE reservations SET status = 'checked_out' WHERE id = ? AND status = 'checked_in' RETURNING id",
      [id],
    );
    if (roomId) {
      await db.execute({ sql: "UPDATE rooms SET status = 'maintenance' WHERE id = ?", args: [roomId] });
    }
  }

  async getActiveReservationRow(userId: number) {
    return queryOne<ReservationHistoryRow>(
      `${BASE}
       WHERE g.email = (SELECT email FROM users WHERE id = ? COLLATE NOCASE)
         AND r.status IN ('pending', 'pending_payment', 'confirmed', 'checked_in')
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 1`,
      [userId],
    );
  }
}