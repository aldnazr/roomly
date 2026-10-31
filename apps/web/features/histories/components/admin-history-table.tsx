import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  countNights,
  formatDate,
  formatRupiah,
  paymentStatusMeta,
  reservationStatusMeta,
} from "@/lib/utils";
import type { AdminHistoryResponse } from "../admin/type";

import { HistoryEmpty } from "./history-states";

export type AdminHistoryItem = AdminHistoryResponse["data"][number];

function paymentLabel(order: AdminHistoryItem): string {
  return [order.payment?.method, order.payment?.bank]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.toUpperCase())
    .join(" ");
}

export function AdminHistoryTable({ orders }: { orders: AdminHistoryItem[] }) {
  if (orders.length === 0) {
    return (
      <HistoryEmpty
        title="Belum ada pesanan"
        description="Pesanan tamu akan muncul di sini setelah reservasi pertama dibuat."
      />
    );
  }

  return (
    <Table className="min-w-230">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Pesanan</TableHead>
          <TableHead>Tamu</TableHead>
          <TableHead>Kamar</TableHead>
          <TableHead>Menginap</TableHead>
          <TableHead>Pembayaran</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const status = reservationStatusMeta(order.status);
          const payment = order.payment
            ? paymentStatusMeta(order.payment.status)
            : null;
          const nights = countNights(order.check_in, order.check_out);

          return (
            <TableRow key={order.id}>
              <TableCell>
                <p className="font-mono text-xs font-medium">#{order.id}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(order.order_date, "dd MMM yyyy, HH:mm")}
                </p>
              </TableCell>
              <TableCell>
                <p className="max-w-48 truncate font-medium">
                  {order.customer?.name ?? "-"}
                </p>
                <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                  {order.customer?.email ?? "-"}
                </p>
              </TableCell>
              <TableCell>
                <p className="font-medium">{order.room_type?.name ?? "-"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.room?.room_number
                    ? `Kamar ${order.room.room_number}`
                    : "Belum ditetapkan"}
                </p>
              </TableCell>
              <TableCell>
                <p>
                  {formatDate(order.check_in)} sampai{" "}
                  {formatDate(order.check_out)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nights} malam
                </p>
              </TableCell>
              <TableCell>
                {payment ? (
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {paymentLabel(order)}
                    </span>
                    <Badge variant={payment.variant}>{payment.label}</Badge>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Belum ada
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatRupiah(order.total_price)}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
