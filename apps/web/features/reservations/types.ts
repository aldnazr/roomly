export interface CheckoutReservationPayload {
  room_type_id: string;
  check_in: string;
  check_out: string;
}

export interface CheckoutReservationResponse {
  data: {
    id: string;
    room_type_id: string;
    check_in: string;
    check_out: string;
    total_price: number;
    status: "pending_payment";
  };
}

export interface DailyOperationItem {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  room_type_name: string | null;
  room_number: string | null;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  paid_at: string | null;
}

export interface DailyOperationsResponse {
  data: {
    date: string;
    stats: {
      total_check_ins: number;
      total_check_outs: number;
      occupied_rooms: number;
      available_rooms: number;
    };
    check_ins: DailyOperationItem[];
    check_outs: DailyOperationItem[];
  };
}

export interface ActiveReservationResponse {
  data: import("@/features/histories/guest/type").GuestHistoryResponse["data"][number] | null;
}

export interface CancelReservationResponse {
  message: string;
  data: {
    id: string;
    status: string;
    cancelled_at: string;
  };
}
