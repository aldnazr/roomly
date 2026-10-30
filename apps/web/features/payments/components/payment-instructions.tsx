"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PaymentInstructionsProps {
  method: "va" | "qris";
  bank: "bca" | "bni" | "bri" | "mandiri" | null;
}

function vaSteps(bank: string | null): string[] {
  return [
    `Buka aplikasi mobile banking atau ATM ${bank ? bank.toUpperCase() : ""}.`,
    "Pilih menu Transfer / Virtual Account.",
    "Masukkan nomor Virtual Account yang tertera.",
    "Pastikan nominal sesuai total pembayaran.",
    "Konfirmasi dan selesaikan transaksi.",
  ];
}

function qrisSteps(): string[] {
  return [
    "Buka aplikasi e-wallet atau mobile banking yang mendukung QRIS.",
    "Pilih menu Scan / Bayar.",
    "Arahkan kamera ke kode QR yang tertera.",
    "Pastikan nominal sesuai total pembayaran.",
    "Konfirmasi dan selesaikan transaksi.",
  ];
}

export function PaymentInstructions({ method, bank }: PaymentInstructionsProps) {
  const steps = method === "va" ? vaSteps(bank) : qrisSteps();

  return (
    <Accordion className="w-full">
      <AccordionItem value="instructions">
        <AccordionTrigger>Instruksi pembayaran</AccordionTrigger>
        <AccordionContent>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
