import axios from "axios";
import {
  IconCheck,
  IconDoor,
  IconPhotoOff,
  IconRotateClockwise,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Room } from "../types";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function photoUrls(photos?: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((photo) => {
      if (typeof photo === "string" && photo) return photo;
      if (
        photo &&
        typeof photo === "object" &&
        "url" in photo &&
        typeof (photo as { url?: unknown }).url === "string"
      ) {
        return (photo as { url: string }).url;
      }
      return null;
    })
    .filter((url): url is string => Boolean(url));
}

export type RoomDetailCopy = {
  aboutTitle: string;
  aboutFallback: string;
  amenitiesTitle: string;
  baseRateLabel: string;
  pricePeriod: string;
  capacityLabel: string;
  unitsLabel: string;
  capacitySummary: (capacity: number) => string;
  unitsSummary: (total: number) => string;
  capacityValue: (capacity: number) => string;
  unitsValue: (total: number) => string;
  noPhotosLabel: string;
  noExtraPhotosLabel: string;
  errorTitle: string;
  errorDescription: string;
  notFoundTitle: string;
  notFoundDescription?: string;
  retryLabel: string;
  /**
   * The transport message is developer speak ("Request failed with status
   * code 429"). Staff pages keep it, the public guest page hides it and
   * relies on the description alone.
   */
  hideErrorDetail?: boolean;
  /**
   * A 404 means the room type is gone from the catalogue, so retrying the
   * same request cannot bring it back.
   */
  hideRetryOnNotFound?: boolean;
};

export const DEFAULT_ROOM_DETAIL_COPY: RoomDetailCopy = {
  aboutTitle: "Tentang kamar ini",
  aboutFallback: "No description provided for this room.",
  amenitiesTitle: "Fasilitas",
  baseRateLabel: "Base rate",
  pricePeriod: "/ night",
  capacityLabel: "Max Capacity",
  unitsLabel: "Total Inventory",
  capacitySummary: (capacity) => `${capacity} ${capacity === 1 ? "guest" : "guests"}`,
  unitsSummary: (total) => `${total} ${total === 1 ? "unit" : "units"}`,
  capacityValue: (capacity) => `${capacity} guests`,
  unitsValue: (total) => `${total} units`,
  noPhotosLabel: "No photos uploaded for this room",
  noExtraPhotosLabel: "No additional photos",
  errorTitle: "Could not load room",
  errorDescription: "Could not load room.",
  notFoundTitle: "Room not found",
  retryLabel: "Try again",
};

interface RoomDetailProps {
  room: Room;
  copy?: Partial<RoomDetailCopy>;
}

export function RoomDetail({ room, copy }: RoomDetailProps) {
  const text: RoomDetailCopy = { ...DEFAULT_ROOM_DETAIL_COPY, ...copy };
  const photos = photoUrls(room.photos);
  const amenities = room.amenities ?? [];

  return (
    <div className="space-y-8">
      {photos.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="relative aspect-16/10 md:col-span-2 md:aspect-auto md:h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[0]}
                alt={room.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden flex-col gap-2 md:flex">
              {photos.slice(1, 3).map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative h-39 overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${room.name} ${idx + 2}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {photos.length <= 1 && (
                <div className="flex h-full items-center justify-center bg-muted/50 text-xs text-muted-foreground">
                  {text.noExtraPhotosLabel}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex aspect-21/9 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border/70 bg-muted/40 text-muted-foreground">
          <IconPhotoOff className="size-8" />
          <p className="text-xs">{text.noPhotosLabel}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {room.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IconUsers className="size-4 shrink-0" />
                {text.capacitySummary(room.capacity)}
              </span>
              <span className="flex items-center gap-1.5">
                <IconDoor className="size-4 shrink-0" />
                {text.unitsSummary(room.total_rooms)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              {text.aboutTitle}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {room.description || text.aboutFallback}
            </p>
          </div>

          {amenities.length > 0 && (
            <div className="border-t border-border/60 pt-6">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                {text.amenitiesTitle}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs text-foreground"
                  >
                    <IconCheck className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <Card className="sticky top-20 border border-border/70 bg-card p-6 shadow-xs">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground">
                  {text.baseRateLabel}
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    {idr.format(room.base_price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {text.pricePeriod}
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-border/50 bg-muted/40 p-4 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {text.capacityLabel}
                  </span>
                  <span className="font-medium text-foreground">
                    {text.capacityValue(room.capacity)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{text.unitsLabel}</span>
                  <span className="font-medium text-foreground">
                    {text.unitsValue(room.total_rooms)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface RoomDetailErrorProps {
  error?: Error | null;
  onRetry?: () => void;
  copy?: Partial<RoomDetailCopy>;
}

export function RoomDetailError({ error, onRetry, copy }: RoomDetailErrorProps) {
  const text: RoomDetailCopy = { ...DEFAULT_ROOM_DETAIL_COPY, ...copy };
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const notFound = status === 404;

  let description: string;
  if (notFound && text.notFoundDescription) {
    description = text.notFoundDescription;
  } else if (text.hideErrorDetail) {
    description = text.errorDescription;
  } else {
    description = error?.message || text.errorDescription;
  }

  const showRetry = onRetry && !(notFound && text.hideRetryOnNotFound);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center"
    >
      <p className="text-base font-semibold text-destructive">
        {notFound ? text.notFoundTitle : text.errorTitle}
      </p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">
        {description}
      </p>
      {showRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 h-11 gap-2 sm:h-8"
        >
          <IconRotateClockwise className="size-4" />
          {text.retryLabel}
        </Button>
      )}
    </div>
  );
}
