"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { RoomNotFound } from "@/features/room/components/room-detail";
import { isRoomId } from "@/features/room/room-id";
import { RoomCreate } from "../../create/page";

export default function RoomEditPage() {
  const { roomId } = useParams<{ roomId: string }>();

  if (!isRoomId(roomId)) {
    return <RoomNotFound />;
  }

  return (
    <Suspense fallback={null}>
      <RoomCreate roomId={roomId} />
    </Suspense>
  );
}
