export interface RoomResponse {
  data: Room[];
}

export interface Room {
  id: string;
  name: string;
  base_price: number;
  capacity: number;
  description: string | null;
  amenities: string[];
  photos: string[];
  total_rooms: number;
}

export interface RoomDetailResponse {
  data: Room;
}

export interface RoomCreatePayload {
  name: string;
  capacity: number;
  base_price: number;
  description?: string;
  amenities?: string[];
  photos?: string[];
}
