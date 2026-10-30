// Sinkronkan dengan apps/api (PaymentDTO)

export type PaymentStatus = "pending" | "paid" | "failed" | "expired";
export type PaymentMethod = "va" | "qris";
export type BankCode = "bca" | "bni" | "bri" | "mandiri";

export interface PaymentDTO {
  data: {
    id: string;
    reservation_id: string;
    amount: number;
    currency: "IDR";
    method: PaymentMethod;
    bank: BankCode | null;
    status: PaymentStatus;
    va_number: string | null;
    qr_string: string | null;
    expires_at: string;
    server_time: string;
    remaining_seconds: number;
    paid_at: string | null;
  };
}

export interface PaymentPayload {
  reservation_id: string;
  method: PaymentMethod;
  bank?: BankCode;
}
