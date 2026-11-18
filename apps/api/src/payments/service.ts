import { SystemClock } from "../infrastructure/clock";
import { LibsqlPaymentRepository } from "./infrastructure/payment-repository";
import { MockPaymentProvider } from "../infrastructure/payment-provider";
import { PaymentService } from "./application/use-cases";
import { toPaymentDTO } from "./application/mappers";
import type { AuthUser } from "../auth/middleware";
import type { BankCode, PaymentMethod } from "./types";

const service = new PaymentService(
  new LibsqlPaymentRepository(),
  (nowFn) => new MockPaymentProvider(nowFn),
  new SystemClock(),
);

export { toPaymentDTO };

export async function transitionPayment(paymentId: string, newStatus: "paid" | "failed" | "expired", nowFn?: () => Date) {
  // ignore nowFn for simplicity; service uses clock
  return service.transitionPayment(paymentId, newStatus);
}

export async function getPayment(paymentId: string, user: AuthUser, nowFn?: () => Date) {
  return service.getPayment(paymentId, user);
}

export async function createPayment(input: { reservationId: string; method: PaymentMethod; bank?: BankCode }, user: AuthUser, nowFn?: () => Date) {
  return service.createPayment(input, user);
}

export async function getPaymentRow(id: string) {
  return service.getPaymentRow(id);
}

export async function getPaymentByProviderRef(providerRef: string) {
  return service.getPaymentByProviderRef(providerRef);
}
export async function expireStalePayments(nowFn?: () => Date) {
  return service.expireStalePayments();
}
