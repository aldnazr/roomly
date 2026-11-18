import type { AuthUser } from "../auth/middleware";

export type ReservationHistoryRow = {
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

export interface ReservationRepository {
  getUserAccount(userId: number): Promise<{ name: string; email: string } | null>;
  findGuestByEmail(email: string): Promise<{ id: number } | null>;
  createGuest(name: string, email: string): Promise<{ id: number }>;
  findAvailableRoom(roomTypeId: string, checkOut: string, checkIn: string): Promise<{ id: string } | null>;
  createCheckoutReservation(input: {
    guestId: number;
    roomTypeId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
  }): Promise<{
    id: number;
    room_type_id: string;
    check_in: string;
    check_out: string;
    total_price: number;
    status: string;
  }>;
  listReservationsByEmail(email: string): Promise<ReservationHistoryRow[]>;
  getReservationById(id: number): Promise<ReservationHistoryRow | null>;
  getUserEmail(userId: number): Promise<string | null>;
  getGuestEmail(guestId: number | null): Promise<string | null>;
  hasPermission(role: string, slug: string): Promise<boolean>;
  listCheckIns(date: string): Promise<ReservationHistoryRow[]>;
  listCheckOuts(date: string): Promise<ReservationHistoryRow[]>;
  getRoomStats(): Promise<{ occupied_rooms: number; available_rooms: number }>;
  cancelReservation(id: number): Promise<{ id: number; status: string } | null>;
  getReservationForCheckIn(id: number): Promise<{ id: number; room_id: string | null; status: string } | null>;
  setCheckedIn(id: number, roomId: string): Promise<void>;
  getReservationForCheckOut(id: number): Promise<{ id: number; room_id: string | null; status: string } | null>;
  setCheckedOut(id: number, roomId: string | null): Promise<void>;
  getActiveReservationRow(userId: number): Promise<ReservationHistoryRow | null>;
}