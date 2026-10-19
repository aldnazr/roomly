"use client";

import { RoomList } from "@/features/rooms/components/room-list";
import type { RoomListCopy } from "@/features/rooms/components/room-list";
import { RoomListSkeleton } from "@/features/rooms/components/room-list-skeleton";
import { usePublicRooms } from "@/features/rooms/use-public-rooms";

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
  const { data, isLoading, isError, error, refetch } = usePublicRooms();
  const rooms = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Kamar yang bisa Anda pesan
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Harga dasar per malam, kapasitas, dan fasilitas setiap tipe kamar di
          Roomly Hotel &amp; Stays.
        </p>
      </div>

      {isLoading ?
        <RoomListSkeleton />
        : <RoomList
          rooms={rooms}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          hrefBase="/guest/room"
          copy={GUEST_ROOM_LIST_COPY}
        />
      }
    </div>
  );
}
