import Link from "next/link";
import {
  IconDoor,
  IconPhotoOff,
  IconRotateClockwise,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Room } from "../types";

function photoUrl(photos?: any[]): string | null {
  const p = photos?.[0];
  if (typeof p === "string" && p) return p;
  if (p && typeof p === "object" && typeof p.url === "string") return p.url;
  return null;
}

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export type RoomListCopy = {
  errorTitle: string;
  errorDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  retryLabel: string;
  noPhotoLabel: string;
  capacityLabel: (capacity: number) => string;
  unitsLabel: (total: number) => string;
  pricePeriod: string;
  /**
   * The transport message is developer speak ("Request failed with status
   * code 429"). Staff pages keep it, the public guest page hides it and
   * relies on the description alone.
   */
  hideErrorDetail?: boolean;
};

export const DEFAULT_ROOM_LIST_COPY: RoomListCopy = {
  errorTitle: "Failed to load rooms",
  errorDescription: "An unexpected error occurred while fetching rooms.",
  emptyTitle: "No rooms yet",
  emptyDescription:
    "No room records found. Rooms will appear here once added to the system.",
  retryLabel: "Try again",
  noPhotoLabel: "No photo",
  capacityLabel: (capacity) => `Up to ${capacity} guests`,
  unitsLabel: (total) => `${total} ${total === 1 ? "unit" : "units"}`,
  pricePeriod: "/ night",
};

interface RoomListProps {
  rooms?: Room[];
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  hrefBase?: string;
  copy?: Partial<RoomListCopy>;
}

export function RoomList({
  rooms,
  isError,
  error,
  onRetry,
  hrefBase = "/room",
  copy,
}: RoomListProps) {
  const text: RoomListCopy = { ...DEFAULT_ROOM_LIST_COPY, ...copy };

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center"
      >
        <p className="text-sm font-medium text-destructive">
          {text.errorTitle}
        </p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {text.hideErrorDetail ? text.errorDescription : error?.message || text.errorDescription}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 gap-2"
          >
            <IconRotateClockwise className="size-4" />
            {text.retryLabel}
          </Button>
        )}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 py-16 px-6 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <IconDoor className="size-6" />
        </div>
        <h3 className="font-heading text-base font-medium">{text.emptyTitle}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {text.emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => {
        const photo = photoUrl(room.photos);
        return (
          <Link
            key={room.id}
            href={`${hrefBase}/${room.id}`}
            className="group/room block rounded-4xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full overflow-hidden border border-border/60 bg-card p-0 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/room:border-border group-hover/room:shadow-md">
              <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                {photo ?
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/room:scale-105"
                    loading="lazy"
                  />
                : <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/70">
                    <IconPhotoOff className="size-6" />
                    <span className="text-xs">{text.noPhotoLabel}</span>
                  </div>
                }
                <div className="absolute top-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-md shadow-xs">
                  {text.unitsLabel(room.total_rooms)}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div className="space-y-1.5">
                  <h3 className="font-heading text-base font-semibold text-foreground group-hover/room:text-primary transition-colors">
                    {room.name}
                  </h3>
                  {room.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {room.description}
                    </p>
                  )}
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {a}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        +{room.amenities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <IconUsers className="size-4 shrink-0" />
                    <span>{text.capacityLabel(room.capacity)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {idr.format(room.base_price)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {" "}
                      {text.pricePeriod}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
