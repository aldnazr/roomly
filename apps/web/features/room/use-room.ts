import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomApi } from "./room-api";
import { RoomCreateUpdatePayload } from "./types";

export const roomKeys = {
  all: ["room"] as const,
  list: () => [...roomKeys.all, "list"] as const,
  detail: (id?: string) => [...roomKeys.all, "detail", id] as const,
};

export function useRoom() {
  return useQuery({
    queryKey: roomKeys.list(),
    queryFn: roomApi.list,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoomCreateUpdatePayload) => roomApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roomKeys.list() }),
  });
}

export function useUpdateRoom(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoomCreateUpdatePayload) =>
      roomApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: roomKeys.list() });
    },
  });
}
export function useRoomDetail(id: string) {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: () => roomApi.detail(id),
    enabled: !!id,
  });
}
