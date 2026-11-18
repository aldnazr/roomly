import { LibsqlOrderHistoryRepository } from "./infrastructure/order-history-repository";
import { OrderHistoryService } from "./application/use-cases";

const service = new OrderHistoryService(new LibsqlOrderHistoryRepository());

export type AdminOrderHistoryPayment = any;
export type AdminOrderHistoryItem = any;
export type AdminOrderHistoryResult = any;

export async function listAdminOrderHistory(user: any, filters: any) {
  return service.listAdminOrderHistory(user, filters);
}
