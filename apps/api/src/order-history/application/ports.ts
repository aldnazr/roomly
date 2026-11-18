import type { AdminOrderHistoryFilters } from "../schema";

export type AdminOrderHistoryRow = {
  id: number;
  created_at: string | null;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  paid_at: string | null;
  guest_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  room_id: string | null;
  room_number: string | null;
  room_type_id: string | null;
  room_type_name: string | null;
  room_type_capacity: number | null;
  room_type_base_price: number | null;
  room_type_amenities: string | null;
  payment_id: string | null;
  payment_method: string | null;
  payment_bank: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  payment_paid_at: string | null;
  payment_created_at: string | null;
};

export interface OrderHistoryRepository {
  list(
    filters: AdminOrderHistoryFilters,
    limit: number,
    offset: number,
  ): Promise<AdminOrderHistoryRow[]>;
  count(filters: AdminOrderHistoryFilters): Promise<number>;
  normalize(
    filters: AdminOrderHistoryFilters,
  ): Record<string, string | number | boolean | null>;
}
