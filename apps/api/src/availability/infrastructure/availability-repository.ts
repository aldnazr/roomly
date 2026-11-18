import { query } from "../../db";
import type { AvailabilityRepository } from "../application/ports";

export class LibsqlAvailabilityRepository implements AvailabilityRepository {
  async listRoomTypes(minCapacity: number) {
    const rows = await query<any>(
      `SELECT rt.id, rt.name, rt.base_price, rt.capacity, rt.description, rt.amenities, rt.photos, rt.total_rooms
       FROM room_types rt
       WHERE rt.capacity >= ?
       ORDER BY rt.base_price ASC, rt.name ASC`,
      [minCapacity],
    );
    return rows.map((rt) => ({
      id: rt.id,
      name: rt.name,
      base_price: rt.base_price,
      capacity: rt.capacity,
      description: rt.description,
      amenities: JSON.parse(rt.amenities || "[]"),
      photos: JSON.parse(rt.photos || "[]"),
      total_rooms: rt.total_rooms ?? 0,
    }));
  }

  async listOperableRooms(roomTypeId: string) {
    return query<{ id: string }>("SELECT id FROM rooms WHERE room_type_id = ? AND status <> 'maintenance'", [roomTypeId]);
  }

  async listReservations(roomTypeId: string, checkOut: string, checkIn: string) {
    return query<any>(
      `SELECT id, room_id, check_in, check_out
       FROM reservations
       WHERE room_type_id = ?
         AND status IN ('pending', 'pending_payment', 'confirmed', 'checked_in')
         AND check_in < ?
         AND check_out > ?`,
      [roomTypeId, checkOut, checkIn],
    );
  }

  async listPricingRules(roomTypeId: string, checkOut: string, checkIn: string) {
    return query<any>(
      `SELECT start_date, end_date, price_override, multiplier
       FROM pricing_rules
       WHERE room_type_id = ?
         AND start_date < ?
         AND end_date >= ?
       ORDER BY start_date ASC`,
      [roomTypeId, checkOut, checkIn],
    );
  }
}