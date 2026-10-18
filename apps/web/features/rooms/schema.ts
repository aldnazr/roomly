import { z } from "zod";

export const roomCreateSchema = z.object({
  roomName: z
    .string({ error: "Room name is required" })
    .trim()
    .min(1, "Room name is required")
    .max(100, "Room name must be at most 100 characters"),
  capacity: z
    .number({ error: "Capacity must be a number" })
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1 guest")
    .max(20, "Capacity cannot exceed 20 guests"),
  basePrice: z
    .number({ error: "Base price must be a number" })
    .int("Base price must be an integer")
    .min(0, "Base price cannot be negative")
    .max(100_000_000, "Base price cannot exceed Rp 100.000.000"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  amenities: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Amenity name cannot be empty")
        .max(50, "Amenity name must be at most 50 characters")
    )
    .max(20, "Cannot exceed 20 amenities"),
  photos: z
    .array(z.string().trim().url("Must be a valid URL"))
    .max(10, "Cannot exceed 10 photos"),
});

export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
