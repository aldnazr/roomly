import { axiosInstance } from "@/lib/api/axios-instance";
import { PaymentDTO, PaymentPayload } from "./types";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

export const paymentApi = {
  create: async (payload: PaymentPayload) =>
    (await axiosInstance.post<PaymentDTO>(API_ENDPOINTS.payment.create, payload))
      .data,
  get: async (id: string) =>
    (await axiosInstance.get<PaymentDTO>(API_ENDPOINTS.payment.detail(id))).data,
  simulate: async ({ id, result }: { id: string; result: "paid" | "failed" }) =>
    await axiosInstance.post(API_ENDPOINTS.payment.simulate(id), { result }),
};
