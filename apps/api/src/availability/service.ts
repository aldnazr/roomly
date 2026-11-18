import { LibsqlAvailabilityRepository } from "./infrastructure/availability-repository";
import { AvailabilityService } from "./application/use-cases";
import type { AvailabilityQueryInput } from "./schema";

const service = new AvailabilityService(new LibsqlAvailabilityRepository());

export type { NightlyPrice, AvailableRoomTypeResult, AvailabilityResponseDto } from "./application/ports";

export async function searchAvailability(query: AvailabilityQueryInput) {
  return service.searchAvailability(query);
}
