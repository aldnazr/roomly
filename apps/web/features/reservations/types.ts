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
