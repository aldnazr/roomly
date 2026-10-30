"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrisCardProps {
  qrString: string | null;
  amount: number;
}

export function QrisCard({ qrString, amount }: QrisCardProps) {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4 flex flex-col items-center">
      <div className="bg-white p-3 rounded-md">
        {qrString ? (
          <QRCodeSVG value={qrString} size={200} />
        ) : (
          <div className="size-50 bg-muted" />
        )}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Scan dengan e-wallet atau mobile banking
      </p>
      <p className="text-lg font-semibold">{formatted}</p>
    </div>
  );
}
