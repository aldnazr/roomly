import { axiosInstance } from "@/lib/api/axios-instance";
import { GuestHistoryResponse } from "./guest/type";
import { AdminHistoryResponse } from "./admin/type";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

const historyApi = {
  guest: async () =>
    (await axiosInstance.get<GuestHistoryResponse>(API_ENDPOINTS.history.guest))
      .data,
  admin: async () =>
    (await axiosInstance.get<AdminHistoryResponse>(API_ENDPOINTS.history.admin))
      .data,
};
