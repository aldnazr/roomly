"use client";

import { Button } from "@/components/ui/button";
import { useHasPermission } from "@/components/permission-guard";
import {
  RoomDetail,
  RoomDetailError,
  RoomNotFound,
} from "@/features/rooms/components/room-detail";
import { RoomDetailSkeleton } from "@/features/rooms/components/room-detail-skeleton";
import { isRoomId } from "@/features/rooms/room-id";
import { useRoomDetail } from "@/features/rooms/use-rooms";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const knownRoom = isRoomId(roomId);
  const { data, isLoading, isError, error, refetch } = useRoomDetail(
    knownRoom ? roomId : "",
  );
  const hasPermission = useHasPermission("rooms.update_status");
  const router = useRouter();
  const room = data?.data;

  if (isLoading) {
    return <RoomDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={router.back}>
          <IconArrowLeft className="size-4" />
          Back to rooms
        </Button>
        {hasPermission && knownRoom && (
          <Button
            size={"lg"}
            onClick={() => router.push(`/room/${roomId}/edit`)}
          >
            <IconEdit /> <span>Update</span>
          </Button>
        )}
      </div>

      {!knownRoom ? (
        <RoomNotFound />
      ) : isError || !room ? (
        <RoomDetailError error={error} onRetry={() => refetch()} />
      ) : (
        <RoomDetail room={room} />
      )}
    </div>
  );
}
