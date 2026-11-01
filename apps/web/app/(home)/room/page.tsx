"use client";

import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/hero-section";
import { RoomList } from "@/features/room/components/room-list";
import { RoomListSkeleton } from "@/features/room/components/room-list-skeleton";
import { useRoom } from "@/features/room/use-room";
import Link from "next/link";

export default function RoomPage() {
  const { data, isLoading, isError, error, refetch } = useRoom();
  const rooms = data?.data;

  return (
    <div className="space-y-6">
      <HeroSection
        eyebrow="manajemen kamar"
        title="Rooms"
        description="Browse and manage room inventory, capacity, and nightly rates."
        rightChildren={
          <Button
            size={"lg"}
            nativeButton={false}
            render={<Link href={"/room/create"} />}
          >
            Buat Kamar
          </Button>
        }
      />

      {isLoading ? (
        <RoomListSkeleton />
      ) : (
        <RoomList
          rooms={rooms}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
        />
      )}
    </div>
  );
}
