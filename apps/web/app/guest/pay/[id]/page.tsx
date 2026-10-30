import { Suspense } from "react";
import { PaymentSkeleton } from "@/features/payments/components/payment-skeleton";
import { PaymentPageContent } from "@/features/payments/components/payment-page-content";

export default async function PayPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<PaymentSkeleton />}>
      <PaymentPageContent id={id} />
    </Suspense>
  );
}
