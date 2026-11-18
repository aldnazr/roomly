import { db, query, queryOne } from "../db";
import type { RoomTypeRepository, RoomTypeRecord } from "./application/ports";
import { NotFoundError, ConflictError } from "../shared/domain/errors";

type DbRow = {
  id: string;
  name: string;
  base_price: number;
  capacity: number;
  description: string | null;
  amenities: string;
  photos: string;
  total_rooms: number;
};

function mapRow(row: DbRow): RoomTypeRecord {
  return {
    id: row.id,
    name: row.name,
    base_price: row.base_price,
    capacity: row.capacity,
    description: row.description,
    amenities: JSON.parse(row.amenities || "[]"),
    photos: JSON.parse(row.photos || "[]"),
    total_rooms: row.total_rooms ?? 0,
  };
}

export class LibsqlRoomTypeRepository implements RoomTypeRepository {
  async list(filters?: { capacity_min?: number; capacity_max?: number }): Promise<RoomTypeRecord[]> {
    const conditions: string[] = [];
    const params: number[] = [];
    if (filters?.capacity_min !== undefined) {
      conditions.push("rt.capacity >= ?");
      params.push(filters.capacity_min);
    }
    if (filters?.capacity_max !== undefined) {
      conditions.push("rt.capacity <= ?");
      params.push(filters.capacity_max);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await query<DbRow>(
      `SELECT rt.id, rt.name, rt.base_price, rt.capacity, rt.description, rt.amenities, rt.photos, rt.total_rooms
       FROM room_types rt
       ${whereClause}
       ORDER BY rt.name COLLATE NOCASE ASC`,
      params,
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<RoomTypeRecord | null> {
    const row = await queryOne<DbRow>(
      `SELECT rt.id, rt.name, rt.base_price, rt.capacity, rt.description, rt.amenities, rt.photos, rt.total_rooms
       FROM room_types rt
       WHERE rt.id = ?`,
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async create(input: {
    id: string;
    name: string;
    base_price: number;
    capacity: number;
    description: string | null;
    amenities: string[];
    photos: string[];
    total_rooms: number;
  }): Promise<RoomTypeRecord> {
    const row = await queryOne<DbRow>(
      `INSERT INTO room_types (id, name, base_price, capacity, description, amenities, photos, total_rooms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, name, base_price, capacity, description, amenities, photos, total_rooms`,
      [input.id, input.name, input.base_price, input.capacity, input.description, JSON.stringify(input.amenities), JSON.stringify(input.photos), input.total_rooms],
    );
    return mapRow(row!);
  }

  async update(id: string, input: {
    name?: string;
    base_price?: number;
    capacity?: number;
    description?: string | null;
    amenities?: string[];
    photos?: string[];
    total_rooms?: number;
  }): Promise<RoomTypeRecord> {
    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    if (input.name !== undefined) { updates.push("name = ?"); params.push(input.name); }
    if (input.base_price !== undefined) { updates.push("base_price = ?"); params.push(input.base_price); }
    if (input.capacity !== undefined) { updates.push("capacity = ?"); params.push(input.capacity); }
    if (input.description !== undefined) { updates.push("description = ?"); params.push(input.description); }
    if (input.amenities !== undefined) { updates.push("amenities = ?"); params.push(JSON.stringify(input.amenities)); }
    if (input.photos !== undefined) { updates.push("photos = ?"); params.push(JSON.stringify(input.photos)); }
    if (input.total_rooms !== undefined) { updates.push("total_rooms = ?"); params.push(input.total_rooms); }
    params.push(id);
    await db.execute({ sql: `UPDATE room_types SET ${updates.join(", ")} WHERE id = ?`, args: params });
    const updated = await this.getById(id);
    if (!updated) throw new NotFoundError("Room type not found");
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.execute({ sql: "DELETE FROM room_types WHERE id = ?", args: [id] });
  }

  async findByName(name: string): Promise<{ id: string } | null> {
    return queryOne<{ id: string }>("SELECT id FROM room_types WHERE name = ? COLLATE NOCASE", [name]);
  }

  async countRooms(id: string): Promise<number> {
    return (await queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM rooms WHERE room_type_id = ?", [id]))?.count ?? 0;
  }

  async countReservations(id: string): Promise<number> {
    return (await queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM reservations WHERE room_type_id = ?", [id]))?.count ?? 0;
  }
}