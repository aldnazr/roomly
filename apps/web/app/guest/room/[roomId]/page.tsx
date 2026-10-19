"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  RoomDetail,
  RoomDetailError,
  type RoomDetailCopy,
} from "@/features/rooms/components/room-detail";
import { RoomDetailSkeleton } from "@/features/rooms/components/room-detail-skeleton";
import { usePublicRoom } from "@/features/rooms/use-public-rooms";

const GUEST_ROOM_DETAIL_COPY: RoomDetailCopy = {
  aboutTitle: "Tentang kamar ini",
  aboutFallback: "Belum ada deskripsi untuk kamar ini.",
  amenitiesTitle: "Fasilitas",
  baseRateLabel: "Harga dasar",
  pricePeriod: "/ malam",
  capacityLabel: "Kapasitas",
  unitsLabel: "Jumlah unit",
  capacitySummary: (capacity) => `Untuk ${capacity} tamu`,
  unitsSummary: (total) => `${total} unit`,
  capacityValue: (capacity) => `${capacity} tamu`,
  unitsValue: (total) => `${total} unit`,
  noPhotosLabel: "Belum ada foto untuk kamar ini",
  noExtraPhotosLabel: "Belum ada foto tambahan",
  errorTitle: "Gagal memuat detail kamar",
  errorDescription:
    "Server tidak dapat dihubungi. Periksa koneksi, lalu coba lagi.",
  notFoundTitle: "Kamar tidak ditemukan",
  notFoundDescription: "Tipe kamar ini sudah tidak ada di katalog.",
  retryLabel: "Coba lagi",
  hideErrorDetail: true,
  hideRetryOnNotFound: true,
};

function BackToCatalog() {
  return (
    <Button
      variant="ghost"
      nativeButton={false}
      render={<Link href={"/guest"} />}
      className="h-11 px-2 sm:h-9 sm:px-3"
    >
      <IconArrowLeft className="size-4" />
      Kembali ke daftar kamar
    </Button>
  );
}

export default function GuestRoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data, isLoading, isError, error, refetch } = usePublicRoom(roomId);
  const room = data?.data;

  if (isLoading) {
    return <RoomDetailSkeleton label="Memuat detail kamar" />;
  }

  return (
    <div className="space-y-6">
      <BackToCatalog />

      {isError || !room ? (
        <RoomDetailError
          error={error}
          onRetry={() => refetch()}
          copy={GUEST_ROOM_DETAIL_COPY}
        />
      ) : (
        <RoomDetail room={room} copy={GUEST_ROOM_DETAIL_COPY} />
      )}
    </div>
  );
}
