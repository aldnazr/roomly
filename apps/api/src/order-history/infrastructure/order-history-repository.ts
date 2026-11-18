import { query, queryOne } from "../../db";
import type {
  AdminOrderHistoryRow,
  OrderHistoryRepository,
} from "../application/ports";
import type { AdminOrderHistoryFilters } from "../schema";

const BASE_SQL = `
  SELECT
    r.id AS id,
    r.created_at AS created_at,
    r.check_in AS check_in,
    r.check_out AS check_out,
    r.status AS status,
    r.total_price AS total_price,
    r.paid_at AS paid_at,
    g.id AS guest_id,
    g.name AS guest_name,
    g.email AS guest_email,
    g.phone AS guest_phone,
    rm.id AS room_id,
    rm.room_number AS room_number,
    rt.id AS room_type_id,
    rt.name AS room_type_name,
    rt.capacity AS room_type_capacity,
    rt.base_price AS room_type_base_price,
    rt.amenities AS room_type_amenities,
    p.id AS payment_id,
    p.method AS payment_method,
    p.bank AS payment_bank,
    p.status AS payment_status,
    p.amount AS payment_amount,
    p.paid_at AS payment_paid_at,
    p.created_at AS payment_created_at
  FROM reservations r
  LEFT JOIN guests g ON g.id = r.guest_id
  LEFT JOIN rooms rm ON rm.id = r.room_id
  LEFT JOIN room_types rt ON rt.id = r.room_type_id
  LEFT JOIN payments p ON p.id = (
    SELECT pay.id
    FROM payments pay
    WHERE pay.reservation_id = r.id
    ORDER BY pay.created_at DESC, pay.id DESC
    LIMIT 1
  )
`;

function buildWhere(filters: AdminOrderHistoryFilters): {
  clause: string;
  params: (string | number)[];
  normalized: Record<string, string | number | boolean | null>;
} {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  const normalized: Record<string, string | number | boolean | null> = {};

  const paymentMethod = filters.payment_method ?? filters.method;
  const startDate = filters.start_date ?? filters.date_from ?? filters.from;
  const endDate = filters.end_date ?? filters.date_to ?? filters.to;

  if (filters.status) {
    conditions.push("r.status = ?");
    params.push(filters.status);
    normalized.status = filters.status;
  }
  if (paymentMethod) {
    conditions.push("p.method = ?");
    params.push(paymentMethod);
    normalized.payment_method = paymentMethod;
  }
  if (filters.payment_status) {
    conditions.push("p.status = ?");
    params.push(filters.payment_status);
    normalized.payment_status = filters.payment_status;
  }
  if (startDate) {
    conditions.push("date(r.created_at) >= date(?)");
    params.push(startDate);
    normalized.start_date = startDate;
  }
  if (endDate) {
    conditions.push("date(r.created_at) <= date(?)");
    params.push(endDate);
    normalized.end_date = endDate;
  }
  if (filters.check_in_from) {
    conditions.push("r.check_in >= ?");
    params.push(filters.check_in_from);
    normalized.check_in_from = filters.check_in_from;
  }
  if (filters.check_in_to) {
    conditions.push("r.check_in <= ?");
    params.push(filters.check_in_to);
    normalized.check_in_to = filters.check_in_to;
  }

  const clause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { clause, params, normalized };
}

export class LibsqlOrderHistoryRepository implements OrderHistoryRepository {
  async list(filters: AdminOrderHistoryFilters, limit: number, offset: number) {
    const { clause, params } = buildWhere(filters);
    return query<AdminOrderHistoryRow>(
      `${BASE_SQL} ${clause} ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
  }

  async count(filters: AdminOrderHistoryFilters) {
    const { clause, params } = buildWhere(filters);
    const countRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM reservations r
       LEFT JOIN payments p ON p.id = (
         SELECT pay.id FROM payments pay WHERE pay.reservation_id = r.id
         ORDER BY pay.created_at DESC, pay.id DESC LIMIT 1
       )
       ${clause}`,
      params,
    );
    return countRow?.total ?? 0;
  }

  normalize(filters: AdminOrderHistoryFilters) {
    return buildWhere(filters).normalized;
  }
}
