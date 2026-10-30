"use client";

import { PaymentHeader } from "./payment-header";
import { CountdownDisplay } from "./countdown-display";
import { VaCard } from "./va-card";
import { QrisCard } from "./qris-card";
import { PaymentInstructions } from "./payment-instructions";
import { PaymentStateNotice } from "./payment-state-notice";
import { PaymentDTO } from "@/features/payments/types";
import { DevSimulatePanel } from "./dev-simulate-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PaymentViewProps {
  payment: PaymentDTO;
  secondsRemaining: number;
  onRetry?: () => void;
  onReorder?: () => void;
  onSimulate?: (result: "paid" | "failed") => void;
}

export function PaymentView({
  payment,
  secondsRemaining,
  onRetry,
  onReorder,
  onSimulate,
}: PaymentViewProps) {
  const {
    status,
    method,
    bank,
    va_number: vaNumber,
    qr_string: qrString,
    amount,
  } = payment.data;

  if (status === "paid" || status === "failed" || status === "expired") {
    return (
      <Card className="gap-5 py-0 shadow-sm">
        <CardHeader className="border-b py-5">
          <CardTitle>Ringkasan pembayaran</CardTitle>
          <CardDescription>
            Periksa status transaksi Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <PaymentHeader amount={amount} status={status} />
          <PaymentStateNotice
            status={status}
            onRetry={onRetry}
            onReorder={onReorder}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="gap-5 py-0 shadow-sm">
        <CardHeader className="border-b py-5">
          <CardTitle>Selesaikan pembayaran</CardTitle>
          <CardDescription>
            Gunakan detail berikut sebelum waktu pembayaran habis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <PaymentHeader amount={amount} status={status} />
          <CountdownDisplay secondsRemaining={secondsRemaining} />
          {method === "va" ? (
            <VaCard bank={bank} vaNumber={vaNumber} />
          ) : (
            <QrisCard qrString={qrString} amount={amount} />
          )}
          <PaymentInstructions method={method} bank={bank} />
        </CardContent>
      </Card>
      <DevSimulatePanel onSimulate={onSimulate} />
    </div>
  );
}
