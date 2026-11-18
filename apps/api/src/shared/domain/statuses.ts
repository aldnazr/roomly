export type ReservationStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "expired";

export type RoomStatus = "available" | "occupied" | "maintenance";

export type PaymentMethod = "va" | "qris";

export type BankCode = "bca" | "bni" | "bri" | "mandiri";

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  "pending",
  "pending_payment",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
];

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "expired",
];
