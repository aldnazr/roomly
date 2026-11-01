import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "@/features/payments/payment-api";
import type { BankCode, PaymentMethod } from "@/features/payments/types";
import { reservationApi } from "./reservation-api";
import { historyKeys } from "@/features/histories/use-history";

type CheckoutPayload = {
  roomTypeId: string;
  stay: {
    from: Date;
    to: Date;
  };
  method: PaymentMethod;
  bank: BankCode;
};

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async ({ roomTypeId, stay, method, bank }: CheckoutPayload) => {
      const reservation = await reservationApi.createCheckout({
        room_type_id: roomTypeId,
        check_in: format(stay.from, "yyyy-MM-dd"),
        check_out: format(stay.to, "yyyy-MM-dd"),
      });

      return paymentApi.create({
        reservation_id: reservation.data.id,
        method,
        ...(method === "va" ? { bank } : {}),
      });
    },
  });
}

export const reservationKeys = {
  all: ["reservations"] as const,
  dailyOperations: (date?: string) => [...reservationKeys.all, "daily-operations", date] as const,
  active: () => [...reservationKeys.all, "active"] as const,
};

export function useDailyOperations(date?: string, enabled = true) {
  return useQuery({
    queryKey: reservationKeys.dailyOperations(date),
    queryFn: () => reservationApi.getDailyOperations(date),
    enabled,
  });
}

export function useActiveReservation(enabled = true) {
  return useQuery({
    queryKey: reservationKeys.active(),
    queryFn: reservationApi.getActive,
    enabled,
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      reservationApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.active() });
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

export function useCheckInReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationApi.checkIn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all });
    },
  });
}

export function useCheckOutReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationApi.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all });
    },
  });
}