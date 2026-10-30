export interface AdminHistoryResponse {
  data: Data[];
  meta: Meta;
}

interface Data {
  id: string;
  order_date: string;
  status: string;
  check_in: string;
  check_out: string;
  total_price: number;
  currency: string;
  customer: Customer;
  room: Room;
  room_type: RoomType;
  payment: Payment;
  payment_method: string;
  payment_status: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Room {
  id: string;
  room_number: string;
}

interface RoomType {
  id: string;
  name: string;
  type: string;
  capacity: number;
  base_price: number;
  amenities: string[];
}

interface Payment {
  id: string;
  method: string;
  bank?: string;
  status: string;
  amount: number;
  paid_at?: string;
  created_at: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  filters: Filters;
}

interface Filters {
  page: number;
  limit: number;
}
