import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HistoryTableSkeleton() {
  return (
    <Table
      className="min-w-230"
      aria-label="Memuat riwayat pesanan"
      aria-busy="true"
    >
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
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index} className="hover:bg-transparent">
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-3 w-24" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-12" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="ml-auto h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-24 rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function HistoryListSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-label="Memuat riwayat pesanan"
      aria-busy="true"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[2rem] bg-muted/50 p-1.5 ring-1 ring-foreground/5"
        >
          <div className="grid gap-5 rounded-[calc(2rem-6px)] bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
