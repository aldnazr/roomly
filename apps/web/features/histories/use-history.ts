import { useQuery } from "@tanstack/react-query";
import { historyApi } from "./history-api";

export const historyKeys = {
  all: ["history"] as const,
  admin: () => [...historyKeys.all, "admin"] as const,
  guest: () => [...historyKeys.all, "guest"] as const,
};

type HistoryQueryOptions = {
  enabled?: boolean;
};

export function useHistoryAdmin({ enabled = true }: HistoryQueryOptions = {}) {
  return useQuery({
    queryKey: historyKeys.admin(),
    queryFn: historyApi.admin,
    enabled,
  });
}

export function useHistoryGuest({ enabled = true }: HistoryQueryOptions = {}) {
  return useQuery({
    queryKey: historyKeys.guest(),
    queryFn: historyApi.guest,
    enabled,
  });
}
