"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft, IconShoppingBagPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  RoomDetail,
  RoomDetailError,
  RoomNotFound,
  type RoomDetailCopy,
} from "@/features/room/components/room-detail";
import { RoomDetailSkeleton } from "@/features/room/components/room-detail-skeleton";
import { isRoomId } from "@/features/room/room-id";
import { usePublicRoom } from "@/features/room/use-public-room";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChartStore } from "@/lib/store/chart-store";
import { toast } from "sonner";

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
  const knownRoom = isRoomId(roomId);
  const { data, isLoading, isError, error, refetch } = usePublicRoom(
    knownRoom ? roomId : "",
  );
  const room = data?.data;
  const { data: userData } = useSession();
  const isGuest = userData?.user.role?.toLowerCase() === "guest";
  const isMobile = useIsMobile();
  const setChart = useChartStore((s) => s.addItem);
  const handleClick = () => {
    if (!room) return;
    setChart(room);
    toast.success("Kamar Ditambahkan", {
      description: "Kamar berhasil ditambahkan ke keranjang.",
      position: "top-center",
    });
  };

  if (isLoading) {
    return <RoomDetailSkeleton label="Memuat detail kamar" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackToCatalog />
        {isGuest && (
          <Button size={isMobile ? "icon" : "default"} onClick={handleClick}>
            <IconShoppingBagPlus className="size-4 md:size-4.5" />{" "}
            <span className="hidden md:block">Checkout</span>
          </Button>
        )}
      </div>
      {!knownRoom ? (
        <RoomNotFound copy={GUEST_ROOM_DETAIL_COPY} />
      ) : isError || !room ? (
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
