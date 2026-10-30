import { query, queryOne } from "../db";
import { HttpError } from "../errors";
import type { AuthUser } from "../auth/middleware";
import type { AdminOrderHistoryFilters } from "./schema";

type AdminOrderHistoryRow = {
  id: number;
  created_at: string | null;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  paid_at: string | null;
  guest_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  room_id: string | null;
  room_number: string | null;
  room_type_id: string | null;
  room_type_name: string | null;
  room_type_capacity: number | null;
  room_type_base_price: number | null;
  room_type_amenities: string | null;
  payment_id: string | null;
  payment_method: string | null;
  payment_bank: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  payment_paid_at: string | null;
  payment_created_at: string | null;
};

export type AdminOrderHistoryPayment = {
  id: string;
  method: string;
  bank: string | null;
  status: string;
  amount: number;
  paid_at: string | null;
  created_at: string | null;
} | null;

export type AdminOrderHistoryItem = {
  id: string;
  order_date: string | null;
  status: string;
  check_in: string;
  check_out: string;
  total_price: number;
  currency: "IDR";
  customer: {
    id: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  room: { id: string; room_number: string | null } | null;
  room_type: {
    id: string;
    name: string | null;
    type: string | null;
    capacity: number | null;
    base_price: number | null;
    amenities: string[];
  } | null;
  payment: AdminOrderHistoryPayment;
  payment_method: string | null;
  payment_status: string | null;
};

export type AdminOrderHistoryResult = {
  data: AdminOrderHistoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    filters: Record<string, string | number | boolean | null>;
  };
};

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

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { clause, params, normalized };
}

function mapRow(row: AdminOrderHistoryRow): AdminOrderHistoryItem {
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
  };
}

export async function listAdminOrderHistory(
  user: AuthUser,
  filters: AdminOrderHistoryFilters,
): Promise<AdminOrderHistoryResult> {
  if (user.role !== "admin") {
    throw new HttpError(403, "Insufficient permissions");
  }

  const { clause, params, normalized } = buildWhere(filters);
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const countRow = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM reservations r
     LEFT JOIN payments p ON p.id = (
       SELECT pay.id FROM payments pay WHERE pay.reservation_id = r.id
       ORDER BY pay.created_at DESC, pay.id DESC LIMIT 1
     )
     ${clause}`,
    params,
  );
  const total = countRow?.total ?? 0;

  const rows = await query<AdminOrderHistoryRow>(
    `${BASE_SQL} ${clause} ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

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
