export type RoomResponse = {
  data: Room[];
};

export type Room = {
  id: number;
  name: string;
  base_price: number;
  capacity: number;
  description: string | null;
  amenities: string[];
  photos: string[];
  total_rooms: number;
};

export type RoomDetailResponse = {
  data: Room;
};

export type RoomCreatePayload = {
  name: string;
  capacity: number;
  base_price: number;
  description?: string;
  amenities?: string[];
  photos?: string[];
};
