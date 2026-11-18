import type {
  CreateRoomTypeInput,
  UpdateRoomTypeInput,
  QueryRoomTypeInput,
} from "../schema";
import type { IdGenerator } from "../../shared/application/infrastructure-ports";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../shared/domain/errors";
import type { RoomTypeRecord, RoomTypeRepository } from "./ports";

export class RoomTypeService {
  constructor(
    private readonly repository: RoomTypeRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async listRoomTypes(query?: QueryRoomTypeInput): Promise<RoomTypeRecord[]> {
    return this.repository.list({
      capacity_min: query?.capacity_min,
      capacity_max: query?.capacity_max,
    });
  }

  async getRoomType(id: string): Promise<RoomTypeRecord> {
    const row = await this.repository.getById(id);
    if (!row) throw new NotFoundError("Room type not found");
    return row;
  }

  async createRoomType(input: CreateRoomTypeInput): Promise<RoomTypeRecord> {
    const existing = await this.repository.findByName(input.name);
    if (existing)
      throw new ConflictError(
        `Room type with name '${input.name}' already exists`,
      );

    return this.repository.create({
      id: this.idGenerator.newId(),
      name: input.name,
      base_price: input.base_price,
      capacity: input.capacity,
      description: input.description ?? null,
      amenities: input.amenities,
      photos: input.photos,
      total_rooms: input.total_rooms ?? 0,
    });
  }

  async updateRoomType(
    id: string,
    input: UpdateRoomTypeInput,
  ): Promise<RoomTypeRecord> {
    await this.getRoomType(id);

    if (input.name) {
      const existing = await this.repository.findByName(input.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(
          `Room type with name '${input.name}' already exists`,
        );
      }
    }

    return this.repository.update(id, {
      name: input.name,
      base_price: input.base_price,
      capacity: input.capacity,
      description: input.description,
      amenities: input.amenities,
      photos: input.photos,
      total_rooms: input.total_rooms,
    });
  }

  async deleteRoomType(id: string): Promise<{ message: string }> {
    await this.getRoomType(id);

    const roomsCount = await this.repository.countRooms(id);
    const reservationsCount = await this.repository.countReservations(id);

    if (roomsCount > 0 || reservationsCount > 0) {
      throw new ConflictError(
        `Cannot delete room type: referenced by ${roomsCount} room(s) and ${reservationsCount} reservation(s)`,
      );
    }

    await this.repository.delete(id);
    return { message: "Room type deleted successfully" };
  }
}
