import { useQuery } from "@tanstack/react-query";
import { historyApi } from "./history-api";

export const historyKeys = {
  all: ["history"] as const,
  admin: () => [...historyKeys.all, "admin"] as const,
  guest: () => [...historyKeys.all, "guest"] as const,
};

export const useHistoryAdmin = useQuery({
  queryKey: historyKeys.admin(),
  queryFn: historyApi.admin,
});

export const useHistoryGuest = useQuery({
  queryKey: historyKeys.guest(),
  queryFn: historyApi.guest,
});
