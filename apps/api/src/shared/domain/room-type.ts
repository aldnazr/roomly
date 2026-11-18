export type RoomType = {
  id: string;
  name: string;
  base_price: number;
  capacity: number;
  description: string | null;
  amenities: string[];
  photos: string[];
  total_rooms: number;
};
