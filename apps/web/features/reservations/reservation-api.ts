import { axiosInstance } from "@/lib/api/axios-instance";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type {
  CheckoutReservationPayload,
  CheckoutReservationResponse,
} from "./types";

export const reservationApi = {
  createCheckout: async (payload: CheckoutReservationPayload) =>
    (
      await axiosInstance.post<CheckoutReservationResponse>(
        API_ENDPOINTS.reservation.checkout,
        payload,
      )
    ).data,
};
