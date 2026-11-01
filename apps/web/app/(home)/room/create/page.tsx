"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconCheck,
  IconPlus,
  IconX,
  IconTrash,
  IconPhoto,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { RoomCreateInput, roomCreateSchema } from "@/features/room/schema";
import { RoomCreatePayload } from "@/features/room/types";
import { RoomNotFound } from "@/features/room/components/room-detail";
import { isRoomId } from "@/features/room/room-id";
import {
  useCreateRoom,
  useUpdateRoom,
  useRoomDetail,
} from "@/features/room/use-room";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PRESET_AMENITIES = [
  "WiFi",
  "AC",
  "TV",
  "Breakfast Included",
  "Mini Bar",
  "Balcony",
  "Safe Deposit",
  "Work Desk",
  "Hot Shower",
];

export default function RoomCreatePage() {
  return (
    <Suspense fallback={null}>
      <RoomCreate />
    </Suspense>
  );
}

export function RoomCreate({ roomId }: { roomId?: string } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = roomId || searchParams.get("id") || searchParams.get("roomId");
  const isEdit = !!editId;
  const knownRoom = isRoomId(editId);
  const knownRoomId = knownRoom ? (editId ?? "") : "";
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom(knownRoomId);
  const { data: roomData, isLoading: roomLoading } = useRoomDetail(knownRoomId);

  const filledRef = useRef<string | null>(null);

  const [customAmenity, setCustomAmenity] = useState("");
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [photoInputError, setPhotoInputError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RoomCreateInput>({
    resolver: zodResolver(roomCreateSchema),
    defaultValues: {
      roomName: "",
      capacity: 2,
      basePrice: 750000,
      description: "",
      amenities: [],
      photos: [],
    },
  });

  const watchAmenities = useWatch({ control, name: "amenities" }) || [];
  const watchPhotos = useWatch({ control, name: "photos" }) || [];
  const watchBasePrice = useWatch({ control, name: "basePrice" });

  useEffect(() => {
    const room = roomData?.data;
    if (!room || !editId) return;
    if (filledRef.current === editId) return;
    filledRef.current = editId;
    reset({
      roomName: room.name ?? "",
      capacity: room.capacity ?? 2,
      basePrice: room.base_price ?? 0,
      description: room.description ?? "",
      amenities: room.amenities ?? [],
      photos: (room.photos ?? [])
        .map((p: any) => (typeof p === "string" ? p : p?.url))
        .filter((u: any): u is string => Boolean(u)),
    });
  }, [roomData, editId, reset]);

  if (isEdit && !knownRoom) {
    return <RoomNotFound />;
  }

  const formattedPrice =
    typeof watchBasePrice === "number" &&
    !isNaN(watchBasePrice) &&
    watchBasePrice > 0
      ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(watchBasePrice) + " / night"
      : null;

  function togglePresetAmenity(preset: string) {
    let next: string[];
    if (watchAmenities.includes(preset)) {
      next = watchAmenities.filter((a) => a !== preset);
    } else {
      if (watchAmenities.length >= 20) return;
      next = [...watchAmenities, preset];
    }
    setValue("amenities", next, { shouldValidate: true });
  }

  function handleAddCustomAmenity() {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (trimmed.length > 50) return;
    if (watchAmenities.length >= 20) return;
    if (!watchAmenities.includes(trimmed)) {
      setValue("amenities", [...watchAmenities, trimmed], {
        shouldValidate: true,
      });
    }
    setCustomAmenity("");
  }

  function handleRemoveAmenity(index: number) {
    const next = watchAmenities.filter((_, i) => i !== index);
    setValue("amenities", next, { shouldValidate: true });
  }

  function handleAddPhoto() {
    setPhotoInputError(null);
    const trimmed = photoUrlInput.trim();
    if (!trimmed) return;

    const urlResult = z.string().url("Must be a valid URL").safeParse(trimmed);
    if (!urlResult.success) {
      setPhotoInputError(
        "Please enter a valid URL starting with http:// or https://",
      );
      return;
    }

    if (watchPhotos.length >= 10) {
      setPhotoInputError("Maximum 10 photos allowed");
      return;
    }

    if (watchPhotos.includes(trimmed)) {
      setPhotoInputError("This photo URL is already added");
      return;
    }

    setValue("photos", [...watchPhotos, trimmed], { shouldValidate: true });
    setPhotoUrlInput("");
  }

  function handleRemovePhoto(index: number) {
    const next = watchPhotos.filter((_, i) => i !== index);
    setValue("photos", next, { shouldValidate: true });
  }

  async function onSubmit(data: RoomCreateInput) {
    const payload: RoomCreatePayload = {
      name: data.roomName,
      capacity: Number(data.capacity),
      base_price: Number(data.basePrice),
      description: data.description?.trim() || undefined,
      amenities: data.amenities || [],
      photos: data.photos || [],
    };

    try {
      if (isEdit && editId) {
        await toast.promise(updateRoom.mutateAsync(payload), {
          loading: "Updating room type...",
          success: `${data.roomName} updated successfully.`,
          error: "Could not update room type.",
        });
      } else {
        await toast.promise(createRoom.mutateAsync(payload), {
          loading: "Creating room type...",
          success: `${data.roomName} created successfully.`,
          error: "Could not create room type.",
        });
      }
      router.push("/room");
    } catch {
      // Error handled by toast.promise
    }
  }

  return (
    <>
      <div className="mb-6 sm:mb-8 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {isEdit ? "Update Room Type" : "Create Room"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          {isEdit
            ? "Update this room type's details, pricing, amenities, and photos."
            : "Define a new category of accommodation including base pricing, capacity, amenities, and photo gallery."}
        </p>
      </div>

      <Card className="max-w-3xl w-full mx-auto p-6 sm:p-8 rounded-xl shadow-xs">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-8"
        >
          {/* Section 1: Basic Information */}
          <FieldSet>
            <FieldLegend>
              Basic Information
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                General details visible to guests during booking.
              </p>
            </FieldLegend>
            <Separator className="my-3" />

            <div className="flex flex-col gap-6">
              <Field data-invalid={!!errors.roomName}>
                <FieldLabel htmlFor="roomName">
                  Room Type Name{" "}
                  <span className="text-destructive ml-0.5">*</span>
                </FieldLabel>
                <Input
                  id="roomName"
                  placeholder="e.g. Deluxe Ocean Suite"
                  aria-invalid={!!errors.roomName}
                  {...register("roomName")}
                />
                <FieldDescription>
                  Clear, descriptive category name (1–100 characters).
                </FieldDescription>
                <FieldError errors={[{ message: errors.roomName?.message }]} />
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="description">
                  Description{" "}
                  <span className="text-xs text-muted-foreground font-normal ml-1.5">
                    (Optional)
                  </span>
                </FieldLabel>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Detailed description of room layout, bed type, view, and unique features..."
                  aria-invalid={!!errors.description}
                  {...register("description")}
                />
                <FieldDescription>
                  Highlight key features for guests (max 1,000 characters).
                </FieldDescription>
                <FieldError
                  errors={[{ message: errors.description?.message }]}
                />
              </Field>
            </div>
          </FieldSet>

          {/* Section 2: Pricing & Capacity */}
          <FieldSet>
            <FieldLegend>
              Pricing & Capacity
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Base rate and guest limit configuration.
              </p>
            </FieldLegend>
            <Separator className="my-3" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Field data-invalid={!!errors.basePrice}>
                <FieldLabel htmlFor="basePrice">
                  Base Price Per Night{" "}
                  <span className="text-destructive ml-0.5">*</span>
                </FieldLabel>
                <div
                  className="flex items-center rounded-md border border-input bg-input/30 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors data-[invalid=true]:border-destructive"
                  data-invalid={!!errors.basePrice}
                >
                  <span className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground border-r border-input flex items-center select-none h-9">
                    Rp
                  </span>
                  <input
                    type="number"
                    id="basePrice"
                    min="0"
                    max="100000000"
                    step="1000"
                    placeholder="750000"
                    aria-invalid={!!errors.basePrice}
                    className="w-full bg-transparent px-3 py-1.5 text-sm font-mono focus:outline-none h-9 text-foreground"
                    {...register("basePrice", { valueAsNumber: true })}
                  />
                </div>
                {formattedPrice && (
                  <p className="text-xs text-muted-foreground mt-1.5 font-sans flex items-center gap-1">
                    {formattedPrice}
                  </p>
                )}
                <FieldError errors={[{ message: errors.basePrice?.message }]} />
              </Field>

              <Field data-invalid={!!errors.capacity}>
                <FieldLabel htmlFor="capacity">
                  Guest Capacity{" "}
                  <span className="text-destructive ml-0.5">*</span>
                </FieldLabel>
                <div
                  className="flex items-center rounded-md border border-input bg-input/30 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors data-[invalid=true]:border-destructive"
                  data-invalid={!!errors.capacity}
                >
                  <input
                    type="number"
                    id="capacity"
                    min="1"
                    max="20"
                    placeholder="2"
                    aria-invalid={!!errors.capacity}
                    className="w-full bg-transparent px-3 py-1.5 text-sm font-medium focus:outline-none h-9 text-foreground"
                    {...register("capacity", { valueAsNumber: true })}
                  />
                  <span className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground border-l border-input flex items-center select-none h-9">
                    guests
                  </span>
                </div>
                <FieldDescription>
                  Maximum occupancy (1–20 guests).
                </FieldDescription>
                <FieldError errors={[{ message: errors.capacity?.message }]} />
              </Field>
            </div>
          </FieldSet>

          {/* Section 3: Room Amenities */}
          <FieldSet>
            <FieldLegend>
              Amenities
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Features and services included in this room type.
              </p>
            </FieldLegend>
            <Separator className="my-3" />

            <Field data-invalid={!!errors.amenities}>
              <FieldLabel>Select Presets</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_AMENITIES.map((preset) => {
                  const isSelected = watchAmenities.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => togglePresetAmenity(preset)}
                      className={
                        isSelected
                          ? "bg-primary/10 text-primary border border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                          : "bg-muted/40 hover:bg-muted/80 text-muted-foreground border border-border/60 text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                      }
                    >
                      {isSelected && (
                        <IconCheck className="size-3.5 text-primary" />
                      )}
                      {preset}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add custom amenity (e.g. Ocean View)..."
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  className="h-9 text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCustomAmenity}
                  className="h-9 px-3 text-xs"
                >
                  Add
                </Button>
              </div>

              {watchAmenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {watchAmenities.map((amenity, index) => (
                    <span
                      key={`${amenity}-${index}`}
                      className="bg-accent text-accent-foreground border border-border/80 rounded-md text-xs font-medium px-2.5 py-1 flex items-center gap-1.5"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(index)}
                        className="hover:text-destructive transition-colors cursor-pointer"
                        aria-label={`Remove ${amenity}`}
                      >
                        <IconX className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <FieldDescription>
                Select presets or enter custom amenities (up to 20 tags, max 50
                chars each).
              </FieldDescription>
              <FieldError errors={[{ message: errors.amenities?.message }]} />
            </Field>
          </FieldSet>

          {/* Section 4: Photo Gallery */}
          <FieldSet>
            <FieldLegend>
              Photo Gallery
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                High-quality image URLs showcasing room interior and bathroom.
              </p>
            </FieldLegend>
            <Separator className="my-3" />

            <Field data-invalid={!!errors.photos || !!photoInputError}>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={photoUrlInput}
                  onChange={(e) => {
                    setPhotoUrlInput(e.target.value);
                    if (photoInputError) setPhotoInputError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPhoto();
                    }
                  }}
                  className="h-9 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPhoto}
                  className="h-9 px-4 text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  <IconPlus className="size-4" />
                  Add Photo
                </Button>
              </div>

              {photoInputError && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {photoInputError}
                </p>
              )}

              {watchPhotos.length === 0 ? (
                <div className="border border-dashed border-border/80 rounded-lg p-6 text-center bg-muted/20 flex flex-col items-center justify-center gap-2 mt-4">
                  <IconPhoto className="size-8 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground font-medium">
                    No photo URLs added yet. Add image links above to preview
                    gallery.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {watchPhotos.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="aspect-16/10 relative rounded-lg overflow-hidden border border-border bg-muted/30 group"
                    >
                      <img
                        src={url}
                        alt={`Room photo ${idx + 1}`}
                        className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                      />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 font-medium bg-background/80 backdrop-blur-xs rounded-md shadow-xs">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <FieldDescription>
                Provide up to 10 valid image URLs (http:// or https://). First
                image serves as room cover.
              </FieldDescription>
              <FieldError errors={[{ message: errors.photos?.message }]} />
            </Field>
          </FieldSet>

          {/* Section 5: Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/room")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createRoom.isPending ||
                updateRoom.isPending ||
                isSubmitting ||
                (isEdit && roomLoading)
              }
              className="px-5 font-semibold"
            >
              {createRoom.isPending || updateRoom.isPending || isSubmitting ? (
                <>
                  <Spinner className="size-4 mr-2" />
                  {isEdit ? "Updating Room Type..." : "Creating Room Type..."}
                </>
              ) : isEdit ? (
                "Update Room Type"
              ) : (
                "Create Room Type"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
