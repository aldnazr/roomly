import Link from "next/link";
import {
  IconArrowRight,
  IconCalendar,
  IconDoor,
  IconReceipt2,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countNights,
  formatDate,
  formatRupiah,
  reservationStatusMeta,
} from "@/lib/utils";
import type { GuestHistoryResponse } from "../guest/type";

import { HistoryEmpty } from "./history-states";

export type GuestHistoryItem = GuestHistoryResponse["data"][number];

export function GuestHistoryList({ orders }: { orders: GuestHistoryItem[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[2rem] bg-muted/50 p-1.5 ring-1 ring-foreground/5">
        <div className="rounded-[calc(2rem-6px)] bg-card">
          <HistoryEmpty
            title="Belum ada pesanan"
            description="Pesanan yang sudah dibayar akan tampil di sini. Pilih kamar dari katalog untuk memulai."
          >
            <Button
              nativeButton={false}
              render={<Link href="/guest" />}
              className="group/cta h-11 rounded-full pr-1.5 pl-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              Lihat daftar kamar
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-px">
                <IconArrowRight className="size-4" stroke={1.5} />
              </span>
            </Button>
          </HistoryEmpty>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order, index) => {
        const status = reservationStatusMeta(order.status);
        const nights = countNights(order.check_in, order.check_out);

        return (
          <li
            key={order.id}
            className="animate-in rounded-[2rem] bg-muted/50 p-1.5 ring-1 ring-foreground/5 fade-in slide-in-from-bottom-4 animation-duration-700 fill-mode-[both] [animation-timing-function:cubic-bezier(0.32,0.72,0,1)]"
            style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
          >
            <div className="grid gap-5 rounded-[calc(2rem-6px)] bg-card p-5 shadow-[inset_0_1px_1px_rgb(255_255_255/0.16)] sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <IconReceipt2
                    className="size-3.5"
                    stroke={1.5}
                    aria-hidden="true"
                  />
                  <span>Pesanan #{order.id}</span>
                </div>
                <h2 className="truncate font-heading text-xl font-semibold tracking-tight">
                  {order.room_type_name ?? "Tipe kamar tidak tersedia"}
                </h2>
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <IconCalendar
                      className="size-4 shrink-0"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    {formatDate(order.check_in)} sampai{" "}
                    {formatDate(order.check_out)}
                    <span aria-hidden="true">·</span>
                    {nights} malam
                  </span>
                  <span className="flex items-center gap-2">
                    <IconDoor
                      className="size-4 shrink-0"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    {order.room_number
                      ? `Kamar ${order.room_number}`
                      : "Nomor kamar ditetapkan saat check-in"}
                  </span>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between gap-3 border-t border-border/60 pt-4 sm:flex-col sm:items-end sm:justify-start sm:border-t-0 sm:pt-0">
                <p className="text-lg font-semibold tracking-tight tabular-nums">
                  {formatRupiah(order.total_price)}
                </p>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {order.paid_at && (
                    <span className="text-xs text-muted-foreground">
                      Dibayar {formatDate(order.paid_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
