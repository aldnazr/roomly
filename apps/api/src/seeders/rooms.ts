import { db } from "../db";
import { newId } from "../ids";

const roomTypes = [
  {
    name: "Standard",
    base_price: 350_000,
    capacity: 2,
    description: "Kamar nyaman dengan fasilitas esensial untuk perjalanan singkat.",
    amenities: ["WiFi", "AC", "TV"],
    photos: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900"],
    floor: 1,
    count: 6,
  },
  {
    name: "Deluxe",
    base_price: 650_000,
    capacity: 2,
    description: "Kamar lebih luas dengan area kerja dan pemandangan kota.",
    amenities: ["WiFi", "AC", "TV", "Mini bar", "Brankas"],
    photos: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900"],
    floor: 2,
    count: 5,
  },
  {
    name: "Family",
    base_price: 850_000,
    capacity: 4,
    description: "Kamar luas dengan dua tempat tidur, cocok untuk keluarga.",
    amenities: ["WiFi", "AC", "TV", "Sofa", "Tempat tidur ekstra"],
    photos: ["https://plus.unsplash.com/premium_photo-1746471641440-124e23d6e634?w=900"],
    floor: 3,
    count: 4,
  },
  {
    name: "Suite",
    base_price: 1_200_000,
    capacity: 3,
    description: "Suite dengan ruang tamu terpisah dan fasilitas premium.",
    amenities: ["WiFi", "AC", "TV", "Mini bar", "Brankas", "Bathtub"],
    photos: ["https://plus.unsplash.com/premium_photo-1733353309577-ebe815f18392?w=900"],
    floor: 4,
    count: 3,
  },
] as const;

const upsertRoomTypeSql = `
  INSERT INTO room_types (id, name, base_price, capacity, description, amenities, photos)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET
    base_price = excluded.base_price,
    capacity = excluded.capacity,
    description = excluded.description,
    amenities = excluded.amenities,
    photos = excluded.photos
  RETURNING id
`;

const upsertRoomSql = `
  INSERT INTO rooms (id, room_type_id, room_number)
  VALUES (?, ?, ?)
  ON CONFLICT(room_number) DO UPDATE SET
    room_type_id = excluded.room_type_id
`;

// ponytail: sequential executes instead of one transaction; upserts are idempotent,
// switch to db.transaction(...) if seeding must be atomic.
export async function seedRooms(): Promise<number> {
  let seeded = 0;

  for (const roomType of roomTypes) {
    const result = await db.execute({
      sql: upsertRoomTypeSql,
      args: [
        newId(),
        roomType.name,
        roomType.base_price,
        roomType.capacity,
        roomType.description,
        JSON.stringify(roomType.amenities),
        JSON.stringify(roomType.photos),
      ],
    });
    const id = result.rows[0]!.id as string;

    for (let i = 1; i <= roomType.count; i++) {
      const roomNumber = `${roomType.floor}${String(i).padStart(2, "0")}`;
      await db.execute({ sql: upsertRoomSql, args: [newId(), id, roomNumber] });
      seeded++;
    }
  }

  return seeded;
}

if (import.meta.main) {
  seedRooms()
    .then((seeded) => {
      console.log(`Seeded ${seeded} rooms across ${roomTypes.length} room types`);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}