import { axiosInstance } from "@/lib/api/axios-instance";
import { RoomCreateUpdatePayload, RoomDetailResponse, RoomResponse } from "./types";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

export const roomApi = {
  list: async () =>
    (await axiosInstance.get<RoomResponse>(API_ENDPOINTS.room.list)).data,
  detail: async (id: string) =>
    (await axiosInstance.get<RoomDetailResponse>(API_ENDPOINTS.room.detail(id)))
      .data,
  create: async (payload: RoomCreateUpdatePayload) =>
    (await axiosInstance.post(API_ENDPOINTS.room.create, payload)).data,
  update: async (id: string, payload: RoomCreateUpdatePayload) =>
    (await axiosInstance.patch(API_ENDPOINTS.room.update(id), payload)).data,
  delete: async (id: string) =>
    (await axiosInstance.delete(API_ENDPOINTS.room.delete(id))).data,
};
