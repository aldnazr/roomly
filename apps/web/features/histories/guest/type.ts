export interface GuestHistoryResponse {
  data: Data[];
}

interface Data {
  id: string;
  guest_id: number;
  guest: Guest;
  guest_name: string;
  guest_email: string;
  guest_phone: any;
  room_type_id: string;
  room_type: RoomType;
  room_type_name: string;
  room_id: string;
  room: Room;
  room_number: string;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  paid_at: string;
}

interface Guest {
  id: number;
  name: string;
  email: string;
  phone: any;
}

interface RoomType {
  id: string;
  name: string;
}

interface Room {
  id: string;
  room_number: string;
}
