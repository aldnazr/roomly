"use client";

import { Button } from "@/components/ui/button";

interface DevSimulatePanelProps {
  onSimulate?: (result: "paid" | "failed") => void;
}

export function DevSimulatePanel({ onSimulate }: DevSimulatePanelProps) {
  if (!onSimulate) return null;

  return (
    <div className="rounded-lg border border-dashed p-4 space-y-2">
      <p className="text-xs text-muted-foreground">Dev: Simulasi</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSimulate("paid")}>
          Simulasikan Berhasil
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onSimulate("failed")}
        >
          Simulasikan Gagal
        </Button>
      </div>
    </div>
  );
}
