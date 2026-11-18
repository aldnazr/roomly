export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  newId(): string;
}

export interface PasswordHasher {
  hash(value: string): Promise<string>;
  compare(value: string, hash: string): Promise<boolean>;
}

export interface TokenClaims {
  sub: string;
  role: string;
}

export interface TokenIssuer {
  sign(claims: TokenClaims): Promise<string>;
  verify(token: string): Promise<TokenClaims>;
}

export interface PaymentProviderResult {
  providerRef: string;
  vaNumber?: string;
  qrString?: string;
  expiresAt: Date;
}

export interface PaymentProvider {
  createPayment(input: {
    reservationId: string;
    amount: number;
    method: "va" | "qris";
    bank?: "bca" | "bni" | "bri" | "mandiri";
  }): Promise<PaymentProviderResult>;
  verifyAndParseWebhook(
    rawBody: string,
    signature: string,
  ): { providerRef: string; status: "paid" | "failed" | "expired" };
}

export interface UnitOfWork {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
