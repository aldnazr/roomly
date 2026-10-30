import { z } from "zod";

const reservationStatuses = [
  "pending",
  "pending_payment",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
] as const;

const paymentStatuses = ["pending", "paid", "failed", "expired"] as const;
const paymentMethods = ["va", "qris"] as const;

export const adminOrderHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(reservationStatuses).optional(),
  payment_method: z.enum(paymentMethods).optional(),
  method: z.enum(paymentMethods).optional(),
  payment_status: z.enum(paymentStatuses).optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  check_in_from: z.string().date().optional(),
  check_in_to: z.string().date().optional(),
});

export type AdminOrderHistoryFilters = z.infer<typeof adminOrderHistoryQuerySchema>;

export function parseAdminOrderHistoryQuery(query: unknown): AdminOrderHistoryFilters {
  return adminOrderHistoryQuerySchema.parse(query);
}
