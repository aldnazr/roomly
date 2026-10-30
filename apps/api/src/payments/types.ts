export type PaymentStatus = "pending" | "paid" | "failed" | "expired";
export type PaymentMethod = "va" | "qris";
export type BankCode = "bca" | "bni" | "bri" | "mandiri";

export interface PaymentDTO {
  id: string;
  reservation_id: string;
  amount: number;
  currency: "IDR";
  method: PaymentMethod;
  bank: BankCode | null;
  status: PaymentStatus;
  va_number: string | null;
  qr_string: string | null;
  expires_at: string;        // ISO UTC
  server_time: string;       // ISO UTC, untuk koreksi selisih jam client
  remaining_seconds: number; // >= 0; 0 jika status bukan pending
  paid_at: string | null;
}

export interface DbPaymentRow {
  id: string;
  reservation_id: string;
  amount: number;
  method: PaymentMethod;
  bank: BankCode | null;
  status: PaymentStatus;
  provider_ref: string;
  va_number: string | null;
  qr_string: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProvider {
  createPayment(input: {
    reservationId: string;
    amount: number;
    method: PaymentMethod;
    bank?: BankCode;
  }): Promise<{
    providerRef: string;
    vaNumber?: string;
    qrString?: string;
    expiresAt: Date;
  }>;

  verifyAndParseWebhook(
    rawBody: string,
    signature: string,
  ): { providerRef: string; status: "paid" | "failed" | "expired" };
}
