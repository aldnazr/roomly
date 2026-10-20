import { HttpError } from "../errors";
import { isUuid } from "../ids";

export function parseRoomTypeId(param: string | string[] | undefined): string {
  const value = Array.isArray(param) ? param[0] : param;
  if (!value || !isUuid(value)) {
    throw new HttpError(400, "Invalid room type ID");
  }
  return value;
}
