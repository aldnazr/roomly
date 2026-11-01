"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { IconArrowRight, IconReceipt2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RoomList } from "@/features/room/components/room-list";
import type { RoomListCopy } from "@/features/room/components/room-list";
import { RoomListSkeleton } from "@/features/room/components/room-list-skeleton";
import { usePublicRooms } from "@/features/room/use-public-room";
import {
  useActiveReservation,
  useCancelReservation,
} from "@/features/reservations/use-reservation";
import { formatDate, formatRupiah, reservationStatusMeta } from "@/lib/utils";
import { toast } from "sonner";

const GUEST_ROOM_LIST_COPY: RoomListCopy = {
  errorTitle: "Gagal memuat daftar kamar",
  errorDescription:
    "Server tidak dapat dihubungi. Periksa koneksi, lalu coba lagi.",
  emptyTitle: "Belum ada kamar yang dipublikasikan",
  emptyDescription:
    "Daftar tipe kamar akan tampil di sini setelah hotel menambahkannya ke sistem.",
  retryLabel: "Coba lagi",
  noPhotoLabel: "Belum ada foto",
  capacityLabel: (capacity) => `Untuk ${capacity} tamu`,
  unitsLabel: (total) => `${total} unit`,
  pricePeriod: "/ malam",
  hideErrorDetail: true,
};

export default function GuestPage() {
  const { status: sessionStatus } = useSession();
  const isSignedIn = sessionStatus === "authenticated";
  const { data: activeData, isLoading: activeLoading } =
    useActiveReservation(isSignedIn);
  const {
    data: roomsData,
    isLoading: roomsLoading,
    isError,
    error,
    refetch,
  } = usePublicRooms();
  const cancelMutation = useCancelReservation();
  const [cancelReason, setCancelReason] = useState("");

  const activeReservation = activeData?.data ?? null;
  const rooms = roomsData?.data;

  const handleCancel = async () => {
    if (!activeReservation) return;
    try {
      await cancelMutation.mutateAsync({
        id: activeReservation.id,
        reason: cancelReason.trim() || undefined,
      });
      toast.success("Reservasi berhasil dibatalkan");
      setCancelReason("");
    } catch {
      toast.error("Gagal membatalkan reservasi");
    }
  };

  if (isSignedIn && activeLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] bg-muted/40 p-2 ring-1 ring-foreground/5">
          <div className="rounded-[1.5rem] bg-card p-6">
            <SkeletonBlock />
          </div>
        </div>
      </div>
    );
  }

  if (activeReservation) {
    const status = reservationStatusMeta(activeReservation.status);
    const nights = Math.max(
      0,
      Math.round(
        (new Date(activeReservation.check_out).getTime() -
          new Date(activeReservation.check_in).getTime()) /
          86400000,
      ),
    );

    return (
      <div className="space-y-8">
        <section>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Reservasi aktif Anda
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Detail reservasi yang sedang berjalan. Anda dapat melihat pembayaran
            atau membatalkan sebelum waktu check-in.
          </p>
        </section>

        <section className="rounded-[2rem] bg-muted/40 p-2 ring-1 ring-foreground/5 sm:p-3">
          <div className="rounded-[1.5rem] bg-card p-6 shadow-[inset_0_1px_1px_rgb(255_255_255/0.16)] sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <IconReceipt2
                    className="size-3.5"
                    stroke={1.5}
                    aria-hidden="true"
                  />
                  <span>Booking #{activeReservation.id}</span>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem
                  label="Tipe kamar"
                  value={activeReservation.room_type_name ?? "-"}
                />
                <DetailItem
                  label="Nomor kamar"
                  value={
                    activeReservation.room_number
                      ? `Kamar ${activeReservation.room_number}`
                      : "Ditetapkan saat check-in"
                  }
                />
                <DetailItem
                  label="Check-in"
                  value={formatDate(activeReservation.check_in)}
                />
                <DetailItem
                  label="Check-out"
                  value={formatDate(activeReservation.check_out)}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-[1.5rem] bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total biaya · {nights} malam
                  </p>
                  <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
                    {formatRupiah(activeReservation.total_price)}
                  </p>
                  {activeReservation.paid_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dibayar {formatDate(activeReservation.paid_at)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    nativeButton={false}
                    render={
                      <Link href={`/guest/pay/${activeReservation.id}`} />
                    }
                    className="group/cta rounded-full pr-1.5 pl-5"
                  >
                    Lihat detail &amp; pembayaran
                    <span className="ml-2 flex size-8 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5">
                      <IconArrowRight className="size-4" stroke={1.5} />
                    </span>
                  </Button>

                  {["pending", "pending_payment", "confirmed"].includes(
                    activeReservation.status,
                  ) && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="destructive"
                            className="rounded-full"
                          />
                        }
                      >
                        Batalkan reservasi
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Batalkan reservasi?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Pembatalan dapat dilakukan sebelum waktu check-in.
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          placeholder="Alasan pembatalan (opsional)"
                          value={cancelReason}
                          onChange={(event) =>
                            setCancelReason(event.target.value)
                          }
                          className="min-h-24 rounded-[1.25rem]"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">
                            Batal
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="rounded-full"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending
                              ? "Memproses..."
                              : "Ya, batalkan"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Reservasi sekarang
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Belum memiliki reservasi aktif. Pilih tipe kamar di bawah untuk
            memulai pemesanan.
          </p>
        </div>
      </section>

      <section id="katalog">
        {roomsLoading ? (
          <RoomListSkeleton />
        ) : (
          <RoomList
            rooms={rooms}
            isError={isError}
            error={error}
            onRetry={() => refetch()}
            hrefBase="/guest/room"
            copy={GUEST_ROOM_LIST_COPY}
          />
        )}
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-[1.25rem] bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
