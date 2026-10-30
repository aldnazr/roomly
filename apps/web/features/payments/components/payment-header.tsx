"use client";

import { Badge } from "@/components/ui/badge";

interface PaymentHeaderProps {
  amount: number;
  status: "pending" | "paid" | "failed" | "expired";
}

const STATUS_LABEL: Record<PaymentHeaderProps["status"], string> = {
  pending: "Menunggu pembayaran",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kedaluwarsa",
};

export function PaymentHeader({ amount, status }: PaymentHeaderProps) {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total pembayaran</p>
        <p className="text-2xl font-semibold tracking-tight">{formatted}</p>
      </div>
      <Badge variant={status === "paid" ? "default" : status === "failed" ? "destructive" : "secondary"}>
        {STATUS_LABEL[status]}
      </Badge>
    </div>
  );
}
