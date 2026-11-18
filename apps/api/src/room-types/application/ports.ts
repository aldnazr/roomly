import type { RoomType } from "../../shared/domain/room-type";

export type RoomTypeRecord = RoomType;

export interface RoomTypeRepository {
  list(filters?: { capacity_min?: number; capacity_max?: number }): Promise<RoomTypeRecord[]>;
  getById(id: string): Promise<RoomTypeRecord | null>;
  create(input: {
    id: string;
    name: string;
    base_price: number;
    capacity: number;
    description: string | null;
    amenities: string[];
    photos: string[];
    total_rooms: number;
  }): Promise<RoomTypeRecord>;
  update(id: string, input: {
    name?: string;
    base_price?: number;
    capacity?: number;
    description?: string | null;
    amenities?: string[];
    photos?: string[];
    total_rooms?: number;
  }): Promise<RoomTypeRecord>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<{ id: string } | null>;
  countRooms(id: string): Promise<number>;
  countReservations(id: string): Promise<number>;
}
