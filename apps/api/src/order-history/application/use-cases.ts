import type { AuthUser } from "../../auth/middleware";
import { ForbiddenError } from "../../shared/domain/errors";
import type { AdminOrderHistoryFilters } from "../schema";
import type {
  AdminOrderHistoryItem,
  AdminOrderHistoryResult,
} from "../service";
import type { OrderHistoryRepository } from "./ports";

function mapRow(row: any): AdminOrderHistoryItem {
  const payment =
    row.payment_id === null
      ? null
      : {
          id: row.payment_id,
          method: row.payment_method!,
          bank: row.payment_bank,
          status: row.payment_status!,
          amount: row.payment_amount!,
          paid_at: row.payment_paid_at,
          created_at: row.payment_created_at,
        };

  let amenities: string[] = [];
  if (row.room_type_amenities) {
    try {
      const parsed = JSON.parse(row.room_type_amenities);
      if (Array.isArray(parsed)) amenities = parsed;
    } catch {
      amenities = [];
    }
  }

  return {
    id: String(row.id),
    order_date: row.created_at,
    status: row.status,
    check_in: row.check_in,
    check_out: row.check_out,
    total_price: row.total_price,
    currency: "IDR",
    customer:
      row.guest_id === null
        ? null
        : {
            id: row.guest_id,
            name: row.guest_name,
            email: row.guest_email,
            phone: row.guest_phone,
          },
    room:
      row.room_id === null
        ? null
        : {
            id: row.room_id,
            room_number: row.room_number,
          },
    room_type:
      row.room_type_id === null
        ? null
        : {
            id: row.room_type_id,
            name: row.room_type_name,
            type: row.room_type_name,
            capacity: row.room_type_capacity,
            base_price: row.room_type_base_price,
            amenities,
          },
    payment,
    payment_method: payment?.method ?? null,
    payment_status: payment?.status ?? null,
  } as AdminOrderHistoryItem;
}

export class OrderHistoryService {
  constructor(private readonly repository: OrderHistoryRepository) {}

  async listAdminOrderHistory(
    user: AuthUser,
    filters: AdminOrderHistoryFilters,
  ): Promise<AdminOrderHistoryResult> {
    if (user.role !== "admin") {
      throw new ForbiddenError("Insufficient permissions");
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const total = await this.repository.count(filters);
    const rows = await this.repository.list(filters, limit, offset);
    const normalized = await this.repository.normalize(filters);

    return {
      data: rows.map(mapRow),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
        filters: {
          ...normalized,
          page,
          limit,
        },
      },
    };
  }
}
