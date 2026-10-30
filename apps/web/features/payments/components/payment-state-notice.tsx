"use client";

import { Button } from "@/components/ui/button";

interface PaymentStateNoticeProps {
  status: "paid" | "failed" | "expired";
  onRetry?: () => void;
  onReorder?: () => void;
}

export function PaymentStateNotice({ status, onRetry, onReorder }: PaymentStateNoticeProps) {
  if (status === "paid") {
    return (
      <div role="status" className="rounded-lg border bg-card p-6 text-center space-y-2">
        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
          Pembayaran berhasil
        </p>
        <p className="text-sm text-muted-foreground">
          Terima kasih, pembayaran Anda telah diterima.
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div role="status" className="rounded-lg border bg-card p-6 text-center space-y-3">
        <p className="text-lg font-semibold text-destructive">Pembayaran gagal</p>
        <p className="text-sm text-muted-foreground">
          Silakan coba metode pembayaran lain.
        </p>
        {onRetry && (
          <Button onClick={onRetry} className="w-full sm:w-auto">
            Coba metode lain
          </Button>
        )}
      </div>
    );
  }

  return (
    <div role="status" className="rounded-lg border bg-card p-6 text-center space-y-3">
      <p className="text-lg font-semibold text-muted-foreground">Pembayaran kedaluwarsa</p>
      <p className="text-sm text-muted-foreground">
        Waktu pembayaran telah habis.
      </p>
      {onReorder && (
        <Button onClick={onReorder} className="w-full sm:w-auto">
          Pesan ulang
        </Button>
      )}
    </div>
  );
}
