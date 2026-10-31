"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { IconArrowLeft, IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { GuestHistoryList } from "@/features/histories/components/guest-history-list";
import { HistoryListSkeleton } from "@/features/histories/components/history-skeleton";
import {
  HistoryEmpty,
  HistoryError,
} from "@/features/histories/components/history-states";
import { useHistoryGuest } from "@/features/histories/use-history";

export default function GuestHistoryPage() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const { data, isLoading, isError, refetch } = useHistoryGuest({
    enabled: isSignedIn,
  });
  const orders = data?.data ?? [];

  const isPending = status === "loading" || (isSignedIn && isLoading);

  return (
    <div className="flex flex-col gap-8 py-2 sm:py-6">
      <div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/guest" />}
          className="-ml-2 mb-6 h-11 px-2 sm:h-9"
        >
          <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
          Kembali ke daftar kamar
        </Button>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Akun saya
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Riwayat pesanan
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Semua reservasi yang sudah Anda bayar di Roomly Hotel &amp; Stays.
        </p>
      </div>

      {isPending && <HistoryListSkeleton />}

      {!isPending && !isSignedIn && (
        <div className="rounded-[2rem] bg-muted/50 p-1.5 ring-1 ring-foreground/5">
          <div className="rounded-[calc(2rem-6px)] bg-card">
            <HistoryEmpty
              icon={IconLock}
              title="Masuk untuk melihat riwayat"
              description="Riwayat pesanan hanya tersedia untuk akun yang sudah masuk."
            >
              <Button
                nativeButton={false}
                render={<Link href="/login" />}
                className="h-11 rounded-full px-5"
              >
                Masuk ke akun
              </Button>
            </HistoryEmpty>
          </div>
        </div>
      )}

      {!isPending && isSignedIn && isError && (
        <div className="rounded-[2rem] bg-muted/50 p-1.5 ring-1 ring-foreground/5">
          <div className="rounded-[calc(2rem-6px)] bg-card">
            <HistoryError
              onRetry={() => refetch()}
              description="Server tidak dapat dihubungi. Periksa koneksi, lalu coba lagi."
            />
          </div>
        </div>
      )}

      {!isPending && isSignedIn && !isError && (
        <GuestHistoryList orders={orders} />
      )}
    </div>
  );
}
