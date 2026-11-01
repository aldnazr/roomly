"use client";

import { PermissionGuard } from "@/components/permission-guard";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHistoryTable } from "@/features/histories/components/admin-history-table";
import { HistoryError } from "@/features/histories/components/history-states";
import { HistoryTableSkeleton } from "@/features/histories/components/history-skeleton";
import { useHistoryAdmin } from "@/features/histories/use-history";
import { IconReceipt2 } from "@tabler/icons-react";
import { HeroSection } from "@/components/hero-section";
import { InsetCard } from "@/components/inset-card";

export default function HistoryPage() {
  const { data, isLoading, isError, refetch } = useHistoryAdmin();
  const orders = data?.data ?? [];
  const total = data?.meta.total ?? orders.length;

  return (
    <PermissionGuard permission="bookings.view_all">
      <div className="flex flex-col gap-6">
        <HeroSection
          glowClassName="-right-20 -top-24"
          gridClassName="md:grid-cols-[minmax(0,1fr)_16rem]"
          eyebrow="Operasional"
          title="Riwayat pesanan"
          description="Pantau semua reservasi tamu beserta status pembayarannya dalam satu tempat."
          rightChildren={
            <InsetCard>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <IconReceipt2
                  className="size-5"
                  stroke={1.5}
                  aria-hidden="true"
                />
              </span>
              <div className="mt-5 text-3xl font-semibold tabular-nums">
                {isLoading ? <Skeleton className="h-9 w-14" /> : total}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Total pesanan
              </p>
            </InsetCard>
          }
        />

        <Card className="animate-in fade-in slide-in-from-bottom-4 animation-duration-[800ms] fill-mode-[both] [animation-timing-function:cubic-bezier(0.32,0.72,0,1)]">
          <CardHeader>
            <CardTitle>Semua pesanan</CardTitle>
            <CardDescription>Diurutkan dari pesanan terbaru.</CardDescription>
            <CardAction>
              {!isLoading && !isError && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {orders.length} dari {total}
                </span>
              )}
            </CardAction>
          </CardHeader>
          <CardContent>
            {isLoading && <HistoryTableSkeleton />}
            {isError && !isLoading && (
              <HistoryError onRetry={() => refetch()} />
            )}
            {!isLoading && !isError && <AdminHistoryTable orders={orders} />}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
