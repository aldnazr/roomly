"use client";

import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { usePaymentDetail, useSimulatePayment } from "../use-payment";
import { PaymentSkeleton } from "./payment-skeleton";
import { PaymentView } from "./payment-view";
import { Button } from "@/components/ui/button";

export function PaymentPageContent({ id }: { id: string }) {
  const router = useRouter();
  const {
    data: payment,
    isLoading,
    isError,
    error,
    refetch,
  } = usePaymentDetail(id);
  const simulate = useSimulatePayment();
  const [now, setNow] = useState(() => Date.now());

  const secondsRemaining = useMemo(() => {
    if (!payment || payment.data.status !== "pending") return 0;

    const serverTime = new Date(payment.data.server_time).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((now - serverTime) / 1000));
    return Math.max(0, payment.data.remaining_seconds - elapsedSeconds);
  }, [now, payment]);

  useEffect(() => {
    if (payment?.data.status !== "pending") return;

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [payment?.data.status]);

  useEffect(() => {
    if (payment?.data.status === "pending" && secondsRemaining === 0) {
      void refetch();
    }
  }, [payment?.data.status, refetch, secondsRemaining]);

  const handleSimulate = async (result: "paid" | "failed") => {
    try {
      await simulate.mutateAsync({ id, result });
    } catch {
      toast.error("Status pembayaran tidak dapat diperbarui");
    }
  };

  if (isLoading) return <PaymentSkeleton />;

  if (isError || !payment) {
    const message =
      error instanceof Error
        ? error.message
        : "Kami tidak dapat memuat detail pembayaran ini.";

    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <p className="text-lg font-semibold">Pembayaran tidak tersedia</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/guest" />}
          >
            Kembali ke katalog
          </Button>
          <Button onClick={() => void refetch()}>
            <IconRefresh className="size-4" /> Coba lagi
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href="/guest" />}
        className="mb-5 h-11 px-2 sm:h-9"
      >
        <IconArrowLeft className="size-4" /> Kembali ke katalog
      </Button>
      <PaymentView
        payment={payment}
        secondsRemaining={secondsRemaining}
        onRetry={() => router.push("/guest")}
        onReorder={() => router.push("/guest")}
        onSimulate={handleSimulate}
      />
    </div>
  );
}
