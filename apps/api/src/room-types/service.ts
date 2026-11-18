import { CryptoIdGenerator } from "../infrastructure/id-generator";
import { LibsqlRoomTypeRepository } from "./infrastructure/room-type-repository";
import { RoomTypeService } from "./application/use-cases";

const service = new RoomTypeService(new LibsqlRoomTypeRepository(), new CryptoIdGenerator());

import type { RoomType } from "../shared/domain/room-type";

export type RoomTypeDto = RoomType;

export async function listRoomTypes(query?: any) {
  return service.listRoomTypes(query);
}

export async function getRoomType(id: string) {
  return service.getRoomType(id);
}

export async function createRoomType(input: any) {
  return service.createRoomType(input);
}

export async function updateRoomType(id: string, input: any) {
  return service.updateRoomType(id, input);
}

export async function deleteRoomType(id: string) {
  return service.deleteRoomType(id);
}
