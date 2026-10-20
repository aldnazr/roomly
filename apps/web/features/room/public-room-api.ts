import { axiosInstance } from "@/lib/api/axios-instance";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { RoomDetailResponse, RoomResponse } from "./types";

// Anonymous catalog reads. The request interceptor only attaches a bearer
// token when a session exists, so these calls stay public when there is none.
export const publicRoomApi = {
  list: async () =>
    (await axiosInstance.get<RoomResponse>(API_ENDPOINTS.public.roomTypes)).data,
  detail: async (id: string) =>
    (
      await axiosInstance.get<RoomDetailResponse>(
        API_ENDPOINTS.public.roomType(id),
      )
    ).data,
};
