import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { paymentApi } from "@/features/payments/payment-api";
import type { BankCode, PaymentMethod } from "@/features/payments/types";
import { reservationApi } from "./reservation-api";

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
