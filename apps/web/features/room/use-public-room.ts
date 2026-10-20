import { useQuery } from "@tanstack/react-query";
import { publicRoomApi } from "./public-room-api";

// Kept apart from roomKeys so the staff cache is never served to anonymous
// visitors and vice versa.
export const publicRoomKeys = {
  all: ["public", "room"] as const,
  list: () => [...publicRoomKeys.all, "list"] as const,
  detail: (id?: string) => [...publicRoomKeys.all, "detail", id] as const,
};

export function usePublicRooms() {
  return useQuery({
    queryKey: publicRoomKeys.list(),
    queryFn: publicRoomApi.list,
    // One retry only, so a broken API surfaces its error state quickly
    // instead of leaving the guest on a skeleton for seven seconds.
    retry: 1,
  });
}

export function usePublicRoom(id: string) {
  return useQuery({
    queryKey: publicRoomKeys.detail(id),
    queryFn: () => publicRoomApi.detail(id),
    enabled: !!id,
    // A missing room type stays missing, so retrying only delays the 404.
    retry: false,
  });
}
