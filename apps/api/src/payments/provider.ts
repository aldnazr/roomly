import crypto from "node:crypto";
import type { BankCode, PaymentMethod, PaymentProvider } from "./types";

const BANK_PREFIXES: Record<BankCode, string> = {
  bca: "88000",
  bni: "88010",
  bri: "88020",
  mandiri: "88030",
};

export class MockProvider implements PaymentProvider {
  constructor(private nowFn: () => Date = () => new Date()) {}

  async createPayment(input: {
    reservationId: string;
    amount: number;
    method: PaymentMethod;
    bank?: BankCode;
  }): Promise<{
    providerRef: string;
    vaNumber?: string;
    qrString?: string;
    expiresAt: Date;
  }> {
    const providerRef = `MOCK-REF-${crypto.randomUUID()}`;
    const expiryMinutes = Number(process.env.PAYMENT_EXPIRY_MINUTES || "15");
    const expiresAt = new Date(this.nowFn().getTime() + expiryMinutes * 60 * 1000);

    let vaNumber: string | undefined;
    let qrString: string | undefined;

    if (input.method === "va" && input.bank) {
      const prefix = BANK_PREFIXES[input.bank] ?? "88000";
      const randomDigits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join("");
      vaNumber = `${prefix}${randomDigits}`;
    } else if (input.method === "qris") {
      qrString = `MOCK-QRIS|${providerRef}|${input.amount}`;
    }

    return {
      providerRef,
      vaNumber,
      qrString,
      expiresAt,
    };
  }

  verifyAndParseWebhook(
    rawBody: string,
    signature: string,
  ): { providerRef: string; status: "paid" | "failed" | "expired" } {
    const secret = process.env.MOCK_WEBHOOK_SECRET || "change-me";
    const expectedSig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    const sigBuf = Buffer.from(signature || "", "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new Error("Invalid signature");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new Error("Invalid JSON body");
    }

    if (!parsed.provider_ref || !["paid", "failed", "expired"].includes(parsed.status)) {
      throw new Error("Invalid webhook payload structure");
    }

    return {
      providerRef: parsed.provider_ref,
      status: parsed.status,
    };
  }
}

export function getPaymentProvider(nowFn: () => Date = () => new Date()): PaymentProvider {
  const providerType = process.env.PAYMENT_PROVIDER || "mock";
  if (providerType === "mock") {
    return new MockProvider(nowFn);
  }
  return new MockProvider(nowFn);
}
