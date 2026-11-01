import { axiosInstance } from "@/lib/api/axios-instance";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type {
  ActiveReservationResponse,
  CancelReservationResponse,
  CheckoutReservationPayload,
  CheckoutReservationResponse,
  DailyOperationsResponse,
} from "./types";

export const reservationApi = {
  createCheckout: async (payload: CheckoutReservationPayload) =>
    (
      await axiosInstance.post<CheckoutReservationResponse>(
        API_ENDPOINTS.reservation.checkout,
        payload,
      )
    ).data,
  getDailyOperations: async (date?: string) =>
    (
      await axiosInstance.get<DailyOperationsResponse>(
        API_ENDPOINTS.reservation.dailyOperations,
        { params: date ? { date } : undefined },
      )
    ).data,
  getActive: async () =>
    (await axiosInstance.get<ActiveReservationResponse>(API_ENDPOINTS.reservation.active)).data,
  cancel: async (id: string, reason?: string) =>
    (
      await axiosInstance.post<CancelReservationResponse>(
        API_ENDPOINTS.reservation.cancel(id),
        reason ? { reason } : {},
      )
    ).data,
  checkIn: async (id: string) =>
    (await axiosInstance.post(API_ENDPOINTS.reservation.checkIn(id))).data,
  checkOut: async (id: string) =>
    (await axiosInstance.post(API_ENDPOINTS.reservation.checkOut(id))).data,
};
