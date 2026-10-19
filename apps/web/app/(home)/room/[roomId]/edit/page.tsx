"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { RoomCreate } from "../../create/page";

export default function RoomEditPage() {
  const { roomId } = useParams<{ roomId: string }>();
  return (
    <Suspense fallback={null}>
      <RoomCreate roomId={roomId} />
    </Suspense>
  );
}
