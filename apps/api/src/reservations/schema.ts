import { z } from "zod";
import { MAX_STAY_NIGHTS } from "../availability/schema";

export const createCheckoutReservationSchema = z
  .object({
    room_type_id: z.string().uuid("room_type_id must be a UUID"),
    check_in: z.string().date("check_in must use YYYY-MM-DD"),
    check_out: z.string().date("check_out must use YYYY-MM-DD"),
  })
  .superRefine((data, ctx) => {
    if (data.check_out <= data.check_in) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["check_out"],
        message: "check_out must be after check_in",
      });
      return;
    }

    const stayMs =
      new Date(`${data.check_out}T00:00:00Z`).getTime() -
      new Date(`${data.check_in}T00:00:00Z`).getTime();
    if (stayMs / 86_400_000 > MAX_STAY_NIGHTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["check_out"],
        message: `Stay duration cannot exceed ${MAX_STAY_NIGHTS} nights`,
      });
    }
  });

export const cancelReservationSchema = z
  .object({
    reason: z.string().max(255).optional(),
  })
  .strict();

export type CreateCheckoutReservationInput = z.infer<
  typeof createCheckoutReservationSchema
>;
