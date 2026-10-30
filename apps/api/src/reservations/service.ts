import type { AuthUser } from "../auth/middleware";
import { searchAvailability } from "../availability/service";
import { queryOne } from "../db";
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
       (guest_id, room_type_id, room_id, check_in, check_out, status, total_price)
     VALUES (?, ?, ?, ?, ?, 'pending_payment', ?)
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
