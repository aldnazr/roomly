export const ROOM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Room type ids are uuids, so a route segment that is anything else can only
 * be a stale or hand written link. The pages use this to answer with the
 * not found state instead of asking the API about an id it will reject.
 */
export function isRoomId(value: string | null | undefined): boolean {
  return !!value && ROOM_ID_PATTERN.test(value);
}
