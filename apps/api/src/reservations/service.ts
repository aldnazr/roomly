import type { AuthUser } from "../auth/middleware";
import { searchAvailability } from "../availability/service";
import { query, queryOne } from "../db";
import { HttpError } from "../errors";
import type { CreateCheckoutReservationInput } from "./schema";

type GuestRow = { id: number };

async function guestForUser(user: AuthUser): Promise<GuestRow> {
  const account = await queryOne<{ name: string; email: string }>(
    "SELECT name, email FROM users WHERE id = ?",
    [user.id],
  );
  if (!account) throw new HttpError(401, "Invalid or expired access token");

  const guest = await queryOne<GuestRow>(
    "SELECT id FROM guests WHERE email = ? COLLATE NOCASE ORDER BY id ASC LIMIT 1",
    [account.email],
  );
  if (guest) return guest;

  const created = await queryOne<GuestRow>(
    "INSERT INTO guests (name, email) VALUES (?, ?) RETURNING id",
    [account.name, account.email],
  );
  return created!;
}

export async function createCheckoutReservation(
  input: CreateCheckoutReservationInput,
  user: AuthUser,
) {
  const availability = await searchAvailability({
    check_in: input.check_in,
    check_out: input.check_out,
    guests: 1,
  });
  const selected = availability.results.find(
    (result) => result.room_type.id === input.room_type_id,
  );
  if (!selected) {
    throw new HttpError(409, "Kamar tidak tersedia untuk tanggal tersebut");
  }

  const room = await queryOne<{ id: string }>(
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
    [input.room_type_id, input.check_out, input.check_in],
  );
  if (!room) {
    throw new HttpError(409, "Kamar baru saja dipesan oleh tamu lain");
  }

  const guest = await guestForUser(user);
  const reservation = await queryOne<{
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
    [
      guest.id,
      input.room_type_id,
      room.id,
      input.check_in,
      input.check_out,
       selected.price.total,
     ],
   );
 
   return {
     id: String(reservation!.id),
     room_type_id: reservation!.room_type_id,
     check_in: reservation!.check_in,
     check_out: reservation!.check_out,
     total_price: reservation!.total_price,
     status: reservation!.status,
   };
 }

export type ReservationHistoryDto = {
  id: string;
  guest_id: number | null;
  guest: {
    id: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  room_type_id: string | null;
  room_type: { id: string | null; name: string | null } | null;
  room_type_name: string | null;
  room_id: string | null;
  room: { id: string; room_number: string | null } | null;
  room_number: string | null;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  paid_at: string | null;
};

type ReservationHistoryRow = {
  id: number;
  guest_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  room_type_id: string | null;
  room_type_name: string | null;
  room_id: string | null;
  room_number: string | null;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  paid_at: string | null;
};

async function hasPermission(user: AuthUser, slug: string): Promise<boolean> {
  const row = await queryOne<{ granted: number }>(
    `SELECT 1 AS granted
     FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.slug = ? AND p.slug = ?`,
    [user.role, slug],
  );
  return !!row;
}
async function getUserEmail(user: AuthUser): Promise<string | null> {
  const row = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = ?", [user.id]);
  return row?.email ?? null;
}

function mapReservationHistoryRow(row: ReservationHistoryRow): ReservationHistoryDto {
  return {
    id: String(row.id),
    guest_id: row.guest_id,
    guest:
      row.guest_id === null
        ? null
        : {
            id: row.guest_id,
            name: row.guest_name,
            email: row.guest_email,
            phone: row.guest_phone,
          },
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    guest_phone: row.guest_phone,
    room_type_id: row.room_type_id,
    room_type:
      row.room_type_id === null
        ? null
        : { id: row.room_type_id, name: row.room_type_name },
    room_type_name: row.room_type_name,
    room_id: row.room_id,
    room:
      row.room_id === null
        ? null
        : { id: row.room_id, room_number: row.room_number },
    room_number: row.room_number,
    check_in: row.check_in,
    check_out: row.check_out,
    status: row.status,
    total_price: row.total_price,
    paid_at: row.paid_at,
  };
}

const RESERVATION_HISTORY_BASE = `
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

export async function listReservations(user: AuthUser): Promise<ReservationHistoryDto[]> {
  const email = await getUserEmail(user);

  const params: (string | number)[] = [];
  const conditions: string[] = [];

  // Only reservations whose guest record is linked to the authenticated user
  // (by email) may be returned. Never match on the numeric user id, which
  // refers to a different table and would leak other users' reservations.
  if (email) {
    conditions.push(
      "r.guest_id IN (SELECT g.id FROM guests g WHERE g.email = ? COLLATE NOCASE)",
    );
    params.push(email);
  } else {
    conditions.push("0 = 1");
  }
  conditions.push(
    "(r.paid_at IS NOT NULL OR EXISTS (SELECT 1 FROM payments pay WHERE pay.reservation_id = r.id AND pay.status = 'paid'))",
  );

  const sql = `${RESERVATION_HISTORY_BASE} WHERE ${conditions.join(" AND ")} ORDER BY r.id ASC`;

  const rows = await query<ReservationHistoryRow>(sql, params);
  return rows.map(mapReservationHistoryRow);
}

export async function getReservation(
  id: number,
  user: AuthUser,
): Promise<ReservationHistoryDto> {
  const row = await queryOne<ReservationHistoryRow>(
    `${RESERVATION_HISTORY_BASE} WHERE r.id = ?`,
    [id],
  );
  if (!row) throw new HttpError(404, "Reservation not found");

  const email = await getUserEmail(user);
  const guestRow = await queryOne<{ email: string | null }>(
    "SELECT email FROM guests WHERE id = ?",
    [row.guest_id],
  );
  const isOwner =
    !!email &&
    !!guestRow?.email &&
    email.toLowerCase() === guestRow.email.toLowerCase();

  // Callers with the view_all permission may inspect any reservation.
  const canViewAll = await hasPermission(user, "bookings.view_all");
  if (!isOwner && !canViewAll) throw new HttpError(403, "Access denied to this reservation");

  return mapReservationHistoryRow(row);
}
