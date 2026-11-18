import type { AuthUser } from "../../auth/middleware";
import type { AvailabilityService } from "../../availability/application/use-cases";
import type { Clock } from "../../shared/application/infrastructure-ports";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../shared/domain/errors";
import type { CreateCheckoutReservationInput } from "../schema";
import type { ReservationHistoryRow, ReservationRepository } from "./ports";

function mapReservationHistoryRow(row: ReservationHistoryRow): any {
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

export class ReservationService {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly clock: Clock,
  ) {}

  async createCheckoutReservation(
    input: CreateCheckoutReservationInput,
    user: AuthUser,
  ) {
    const availability = await this.availabilityService.searchAvailability({
      check_in: input.check_in,
      check_out: input.check_out,
      guests: 1,
    });
    const selected = availability.results.find(
      (result) => result.room_type.id === input.room_type_id,
    );
    if (!selected) {
      throw new ConflictError("Kamar tidak tersedia untuk tanggal tersebut");
    }

    const room = await this.repository.findAvailableRoom(
      input.room_type_id,
      input.check_out,
      input.check_in,
    );
    if (!room) {
      throw new ConflictError("Kamar baru saja dipesan oleh tamu lain");
    }

    const account = await this.repository.getUserAccount(user.id);
    if (!account)
      throw new UnauthorizedError("Invalid or expired access token");

    let guest = await this.repository.findGuestByEmail(account.email);
    if (!guest) {
      guest = await this.repository.createGuest(account.name, account.email);
    }

    const reservation = await this.repository.createCheckoutReservation({
      guestId: guest.id,
      roomTypeId: input.room_type_id,
      roomId: room.id,
      checkIn: input.check_in,
      checkOut: input.check_out,
      totalPrice: selected.price.total,
    });

    return {
      id: String(reservation.id),
      room_type_id: reservation.room_type_id,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      total_price: reservation.total_price,
      status: reservation.status,
    };
  }

  async listReservations(user: AuthUser) {
    const email = await this.repository.getUserEmail(user.id);
    if (!email) return [];

    const rows = await this.repository.listReservationsByEmail(email);
    return rows.map(mapReservationHistoryRow);
  }

  async getDailyOperations(date: string) {
    const checkInRows = await this.repository.listCheckIns(date);
    const checkOutRows = await this.repository.listCheckOuts(date);
    const statsRow = await this.repository.getRoomStats();

    return {
      date,
      stats: {
        total_check_ins: checkInRows.length,
        total_check_outs: checkOutRows.length,
        occupied_rooms: statsRow.occupied_rooms,
        available_rooms: statsRow.available_rooms,
      },
      check_ins: checkInRows.map((row) => ({
        id: String(row.id),
        guest_name: row.guest_name,
        guest_email: row.guest_email,
        guest_phone: row.guest_phone,
        room_type_name: row.room_type_name,
        room_number: row.room_number,
        check_in: row.check_in,
        check_out: row.check_out,
        status: row.status,
        total_price: row.total_price,
        paid_at: row.paid_at,
      })),
      check_outs: checkOutRows.map((row) => ({
        id: String(row.id),
        guest_name: row.guest_name,
        guest_email: row.guest_email,
        guest_phone: row.guest_phone,
        room_type_name: row.room_type_name,
        room_number: row.room_number,
        check_in: row.check_in,
        check_out: row.check_out,
        status: row.status,
        total_price: row.total_price,
        paid_at: row.paid_at,
      })),
    };
  }

  async getActiveReservation(user: AuthUser) {
    const row = await this.repository.getActiveReservationRow(user.id);
    if (!row) return null;
    return mapReservationHistoryRow(row);
  }

  async cancelReservation(id: number, user: AuthUser, reason?: string) {
    const row = await this.repository.getReservationById(id);
    if (!row) throw new NotFoundError("Reservation not found");

    const email = await this.repository.getUserEmail(user.id);
    const guestEmail = await this.repository.getGuestEmail(row.guest_id);
    const isOwner =
      !!email &&
      !!guestEmail &&
      email.toLowerCase() === guestEmail.toLowerCase();
    const canManage = await this.repository.hasPermission(
      user.role,
      "bookings.view_all",
    );

    if (!isOwner && !canManage)
      throw new ForbiddenError("Access denied to this reservation");

    if (!["pending", "pending_payment", "confirmed"].includes(row.status)) {
      throw new ConflictError(
        "Reservation cannot be cancelled in its current status",
      );
    }

    const today = this.clock.now().toISOString().slice(0, 10);
    if (row.check_in < today) {
      throw new ValidationError("Reservation check-in date has passed");
    }

    const updated = await this.repository.cancelReservation(id);
    if (!updated)
      throw new ConflictError(
        "Reservation cannot be cancelled in its current status",
      );

    return {
      id: String(updated.id),
      status: updated.status,
      cancelled_at: this.clock.now().toISOString(),
    };
  }

  async checkInReservation(id: number, user: AuthUser) {
    if (
      !(await this.repository.hasPermission(user.role, "bookings.check_in"))
    ) {
      throw new ForbiddenError("Insufficient permissions");
    }

    const reservation = await this.repository.getReservationForCheckIn(id);
    if (!reservation) throw new NotFoundError("Reservation not found");
    if (reservation.status !== "confirmed")
      throw new ConflictError("Reservation is not ready for check-in");
    if (!reservation.room_id)
      throw new ConflictError("No room assigned to this reservation");

    await this.repository.setCheckedIn(id, reservation.room_id);
    return { id: String(id), status: "checked_in" };
  }

  async checkOutReservation(id: number, user: AuthUser) {
    if (
      !(await this.repository.hasPermission(user.role, "bookings.check_out"))
    ) {
      throw new ForbiddenError("Insufficient permissions");
    }

    const reservation = await this.repository.getReservationForCheckOut(id);
    if (!reservation) throw new NotFoundError("Reservation not found");
    if (reservation.status !== "checked_in")
      throw new ConflictError("Reservation is not currently checked in");

    await this.repository.setCheckedOut(id, reservation.room_id);
    return { id: String(id), status: "checked_out" };
  }

  async getReservation(id: number, user: AuthUser) {
    const row = await this.repository.getReservationById(id);
    if (!row) throw new NotFoundError("Reservation not found");

    const email = await this.repository.getUserEmail(user.id);
    const guestEmail = await this.repository.getGuestEmail(row.guest_id);
    const isOwner =
      !!email &&
      !!guestEmail &&
      email.toLowerCase() === guestEmail.toLowerCase();
    const canViewAll = await this.repository.hasPermission(
      user.role,
      "bookings.view_all",
    );

    if (!isOwner && !canViewAll)
      throw new ForbiddenError("Access denied to this reservation");

    return mapReservationHistoryRow(row);
  }
}
