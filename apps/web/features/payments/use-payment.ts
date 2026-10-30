import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "./payment-api";

export function usePayment() {
  return useMutation({
    mutationFn: paymentApi.create,
  });
}

export function usePaymentDetail(id: string) {
  return useQuery({
    queryKey: ["payment", id],
    queryFn: () => paymentApi.get(id),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.data.status === "pending" ? 15_000 : false,
  });
}

export function useSimulatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentApi.simulate,
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["payment", variables.id] }),
  });
}
