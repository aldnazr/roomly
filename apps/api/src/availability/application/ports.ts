import type { RoomType } from "../../shared/domain/room-type";

export type NightlyPrice = {
  date: string;
  price: number;
};

export type AvailableRoomTypeResult = {
  room_type: RoomType;
  available_rooms: number;
  price: {
    nightly: NightlyPrice[];
    total: number;
    average_nightly: number;
  };
};

export type AvailabilityResponseDto = {
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  results: AvailableRoomTypeResult[];
};

export type AvailabilityRoomTypeRow = RoomType;

export type AvailabilityReservationRow = {
  id: number;
  room_id: string | null;
  check_in: string;
  check_out: string;
};

export type AvailabilityPricingRuleRow = {
  start_date: string;
  end_date: string;
  price_override: number | null;
  multiplier: number | null;
};

export interface AvailabilityRepository {
  listRoomTypes(minCapacity: number): Promise<AvailabilityRoomTypeRow[]>;
  listOperableRooms(roomTypeId: string): Promise<{ id: string }[]>;
  listReservations(roomTypeId: string, checkOut: string, checkIn: string): Promise<AvailabilityReservationRow[]>;
  listPricingRules(roomTypeId: string, checkOut: string, checkIn: string): Promise<AvailabilityPricingRuleRow[]>;
}
