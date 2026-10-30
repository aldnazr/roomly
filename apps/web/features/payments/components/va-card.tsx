"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VaCardProps {
  bank: "bca" | "bni" | "bri" | "mandiri" | null;
  vaNumber: string | null;
}

const BANK_NAME: Record<NonNullable<VaCardProps["bank"]>, string> = {
  bca: "BCA",
  bni: "BNI",
  bri: "BRI",
  mandiri: "Mandiri",
};

function groupDigits(value: string): string {
  return value.replace(/(.{4})/g, "$1 ").trim();
}

export function VaCard({ bank, vaNumber }: VaCardProps) {
  const number = vaNumber ?? "";
  const grouped = groupDigits(number);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ""));
      toast.success("Nomor VA disalin");
    } catch {
      toast.error("Gagal menyalin nomor VA");
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Bank {bank ? BANK_NAME[bank] : ""}</p>
      </div>
      <p className="text-xl font-mono tracking-wider">{grouped || "-"}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        aria-label="Salin nomor VA"
        className="w-full sm:w-auto"
      >
        Salin
      </Button>
    </div>
  );
}
