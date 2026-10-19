import { HttpError } from "../errors";

export function parseRoomTypeId(param: string | string[] | undefined): number {
  const value = Array.isArray(param) ? param[0] : param;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid room type ID");
  }
  return id;
}
