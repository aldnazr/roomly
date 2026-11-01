"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";

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

export default function GuestRoomDetailPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();
  const knownRoom = isRoomId(roomId);
  const { data, isLoading, isError, error, refetch } = usePublicRoom(
    knownRoom ? roomId : "",
  );
  const room = data?.data;
  const { data: userData } = useSession();
  const isGuest = userData?.user.role?.toLowerCase() === "guest";
  const isMobile = useIsMobile();
  const setChart = useCartStore((s) => s.addItem);
  const handleClick = () => {
    if (!room) return;
    setChart(room);
    router.push("/guest/checkout");
  };

  if (isLoading) {
    return <RoomDetailSkeleton label="Memuat detail kamar" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton text="Kembali ke daftar kamar" />
        {isGuest && (
          <Button size={isMobile ? "icon" : "lg"} onClick={handleClick}>
            <IconShoppingBagPlus className="size-4 md:size-5" />{" "}
            <span className="hidden md:block">Pesan Sekarang</span>
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
