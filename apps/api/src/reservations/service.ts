import { SystemClock } from "../infrastructure/clock";
import { LibsqlReservationRepository } from "./infrastructure/reservation-repository";
import { LibsqlAvailabilityRepository } from "../availability/infrastructure/availability-repository";
import { AvailabilityService } from "../availability/application/use-cases";
import { ReservationService } from "./application/use-cases";
import type { AuthUser } from "../auth/middleware";

const availabilityService = new AvailabilityService(new LibsqlAvailabilityRepository());
const service = new ReservationService(new LibsqlReservationRepository(), availabilityService, new SystemClock());

export type ReservationHistoryDto = any;
export type DailyOperationItem = any;
export type DailyOperationsDto = any;

export async function createCheckoutReservation(input: any, user: AuthUser) {
  return service.createCheckoutReservation(input, user);
}

export async function listReservations(user: AuthUser) {
  return service.listReservations(user);
}

export async function getDailyOperations(date: string) {
  return service.getDailyOperations(date);
}

export async function getActiveReservation(user: AuthUser) {
  return service.getActiveReservation(user);
}

export async function cancelReservation(id: number, user: AuthUser, reason?: string) {
  return service.cancelReservation(id, user, reason);
}

export async function checkInReservation(id: number, user: AuthUser) {
  return service.checkInReservation(id, user);
}

export async function checkOutReservation(id: number, user: AuthUser) {
  return service.checkOutReservation(id, user);
}

export async function getReservation(id: number, user: AuthUser) {
  return service.getReservation(id, user);
}
