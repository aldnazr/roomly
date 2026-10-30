# API

Express + Turso (libSQL) API for the room booking app.

## Contents

**Setup**

- [Getting started](#getting-started)
- [Database and seeding](#database-and-seeding)
- [Deploy (Vercel)](#deploy-vercel)

**Reference**

- [Conventions](#conventions)
- [Endpoint overview](#endpoint-overview)
- [Auth](#auth)
- [Roles](#roles)
- [Permissions](#permissions)
- [Users](#users)
- [Room Types](#room-types)
- [Public Room Catalog](#public-room-catalog)
- [Availability](#availability)
- [Payments](#payments)
- [Reservations](#reservations)
- [Admin Orders](#admin-orders)

**Other**

- [Known limitations](#known-limitations)

---

## Getting started

### Install

```bash
bun install
cp .env.example .env   # then fill in the values
```

### Environment variables

See `.env.example`.

| Variable                                      | Description                                                       | Default     |
| --------------------------------------------- | ----------------------------------------------------------------- | ----------- |
| `TURSO_DATABASE_URL`                          | `libsql://...` for Turso Cloud or `file:...` for a local database | –           |
| `TURSO_AUTH_TOKEN`                            | Turso auth token (not needed for `file:` databases)               | –           |
| `JWT_SECRET`                                  | Signing secret for access tokens, at least 32 characters          | –           |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the admin seeder                                          | –           |
| `PAYMENT_PROVIDER`                            | Payment provider                                                  | `mock`      |
| `PAYMENT_EXPIRY_MINUTES`                      | Payment expiry window in minutes                                  | `15`        |
| `PAYMENT_MAX_ATTEMPTS`                        | Max payment attempts per reservation                              | `3`         |
| `MOCK_WEBHOOK_SECRET`                         | HMAC secret for the mock webhook                                  | `change-me` |

### Run

```bash
bun run dev     # development with watch
bun run start   # production entrypoint (same TS entry)
bun run build   # type-check
```

## Database and seeding

Migrations run automatically on startup (tracked in `schema_migrations`). You can also run them by hand:

```bash
bun run db:migrate  # apply pending migrations to TURSO_DATABASE_URL
bun run db:setup    # migrate + seed (idempotent, safe to rerun)
```

### Seed commands

| Command              | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `bun run seed`       | Roles, admin, then rooms                                     |
| `bun run seed:roles` | Roles and permissions only                                   |
| `bun run seed:admin` | Admin user from the `ADMIN_*` env vars                       |
| `bun run seed:rooms` | Room types (Standard, Deluxe, Family, Suite) and their rooms |

### Seeder behavior

- **Rooms** are idempotent: room types upsert by name, rooms upsert by `room_number` (existing `status` values are preserved).
- **Room numbers** follow a floor-based pattern: `101`–`106` (Standard), `201`–`205` (Deluxe), `301`–`304` (Family), `401`–`403` (Suite).
- **Admin** is idempotent: rerunning rotates the admin name, password, and role for the configured `ADMIN_EMAIL`. Users without a stored password hash cannot log in.

## Deploy (Vercel)

Create a Vercel project with Root Directory `apps/api` (Express is detected automatically) and set these in the project environment variables:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `JWT_SECRET`
- `CLIENT_ORIGIN`

Data persists in Turso, so redeployments do not reset anything.

---

## Conventions

- **Base URL** in the examples below: `http://localhost:4000`. The examples assume `$TOKEN` holds a valid access token.
- **Authentication:** protected endpoints expect `Authorization: Bearer <access_token>` and answer `401` when the token is missing, malformed, invalid, or expired. See [Auth](#auth).
- **Response envelope:** successful responses are wrapped in `{ "data": ... }`. The payment webhook and simulate endpoints return `{ "message": "OK" }` instead.
- **Response shapes:** a bare `"field"` stands for that field with its actual value.
- **Rate limits:** fixed window, per client IP, kept in memory (see [Known limitations](#known-limitations)). Exceeding a limit returns `429` with a `Retry-After` header.

  | Endpoint                          | Limit               |
  | --------------------------------- | ------------------- |
  | `POST /api/auth/register`         | 5 requests / 60 s   |
  | `/api/public/room-types` (routes) | 120 requests / 60 s |

## Endpoint overview

| Method   | Path                                    | Access                                     |
| -------- | --------------------------------------- | ------------------------------------------ |
| `POST`   | `/api/auth/login`                       | Public                                     |
| `POST`   | `/api/auth/register`                    | Public (rate limited)                      |
| `GET`    | `/api/auth/me`                          | Authenticated                              |
| `GET`    | `/api/roles`                            | Authenticated                              |
| `GET`    | `/api/roles/:slug`                      | Authenticated                              |
| `PUT`    | `/api/roles/:slug/permissions`          | `permissions.manage`                       |
| `GET`    | `/api/permissions`                      | Authenticated                              |
| `GET`    | `/api/users`, `/api/users/:id`          | `users.manage`                             |
| `POST`   | `/api/users`                            | `users.manage`                             |
| `PATCH`  | `/api/users/:id`                        | `users.manage`                             |
| `DELETE` | `/api/users/:id`                        | `users.manage`                             |
| `GET`    | `/api/room-types`, `/:id`               | `rooms.browse`                             |
| `POST`   | `/api/room-types`                       | `room_types.manage`                        |
| `PATCH`  | `/api/room-types/:id`                   | `room_types.manage`                        |
| `DELETE` | `/api/room-types/:id`                   | `room_types.manage`                        |
| `GET`    | `/api/public/room-types`, `/:id`        | Public (rate limited)                      |
| `GET`    | `/api/availability`                     | `rooms.browse`                             |
| `POST`   | `/api/payments`                         | Reservation owner or staff/manager/admin   |
| `GET`    | `/api/payments/:id`                     | Reservation owner or staff/manager/admin   |
| `POST`   | `/api/payments/webhook/mock`            | HMAC signature                             |
| `POST`   | `/api/payments/:id/simulate`            | Reservation access; disabled in production |
| `GET`    | `/api/reservations` (+ aliases), `/:id` | `bookings.view_own` or `bookings.view_all` |
| `GET`    | `/api/admin/orders` (+ aliases)         | `admin` role                               |

---

## Auth

### Login

`POST /api/auth/login` with JSON `{ "email": "...", "password": "..." }` or `{ "username": "...", "password": "..." }` — exactly one of `email` / `username`. A `username` value is matched against both columns, so an email address may also be sent in the `username` field.

```bash
curl -s http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}'
```

- `200` → `{ "data": { "access_token", "expires_in": 3600, "user": { "id", "username", "name", "email", "role" } } }`
- `400` → malformed JSON or invalid fields
- `401` → identical generic error for unknown email/username, wrong password, or missing hash
- `500` → unexpected failure (details only in server logs)

Tokens are HS256 JWTs valid for one hour, carrying `sub` (user id), `role`, `iat`, and `exp`. Send them as `Authorization: Bearer <access_token>` on protected endpoints such as those in [Roles](#roles). There is no refresh or revocation: tokens are valid until expiry.

### Register (guest)

`POST /api/auth/register` creates a new `guest` account. Public endpoint, rate limited per client IP (5 requests per 60 seconds, fixed window, in memory).

```bash
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Guest User","email":"guest@example.com","password":"secure-pass-123"}'
```

- `201` → `{ "data": { "user": { "id", "username": null, "name", "email", "role": "guest" } } }`
- `400` → body validation failed (missing/empty name, invalid email, password < 8 chars)
- `409` → email already in use
- `429` → rate limit exceeded, retry after the `Retry-After` header value
- `500` → guest role not configured (run `bun run seed:roles`)

The registered account has the `guest` role permissions: `rooms.browse`, `bookings.create`, `bookings.view_own`, `bookings.cancel_own`. Registration does not issue a token; call `POST /api/auth/login` afterward to obtain an access token.

### Current user

`GET /api/auth/me` returns the authenticated user's full profile, complete role object, and permissions array.

```bash
curl -s http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

- `200` → `{ "data": { "id": 1, "username": "admin", "name": "Admin", "email": "admin@mail.com", "role": { "slug": "admin", "name": "Admin", "description": "..." }, "permissions": ["rooms.browse", ...] } }`
- `401` → missing, malformed, invalid, or expired token

## Roles

Roles, permissions, and their mappings live in the `roles`, `permissions`, and `role_permissions` tables, seeded by `bun run seed:roles`. Every endpoint below needs `Authorization: Bearer <access_token>` and answers `401` when the token is missing, malformed, invalid, or expired.

Permission checks read the database on each request, so a permission change applies from the next request onward. The `role` claim inside an issued token never changes.

### List

`GET /api/roles` lists every role.

```bash
curl -s http://localhost:4000/api/roles -H "Authorization: Bearer $TOKEN"
```

- `200` → `{ "data": [ { "slug": "staff", "name": "Front Desk / Staff", "description": "...", "permissions": ["rooms.browse", ...] } ] }`

### Get

`GET /api/roles/:slug` returns one role in the same shape.

- `200` → single role object instead of an array
- `404` → unknown role slug

### Replace permissions

`PUT /api/roles/:slug/permissions` replaces the role's full permission set. The caller's role needs the `permissions.manage` permission.

```bash
curl -s -X PUT http://localhost:4000/api/roles/staff/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"permissions":["rooms.browse","bookings.view_all"]}'
```

- `200` → updated role object
- `400` → body failed validation or a permission slug does not exist; nothing is written
- `403` → caller's role lacks `permissions.manage`
- `404` → unknown role slug

Notes:

- `permissions` must be an array of unique non-empty strings. `[]` strips every permission from the role.
- The replace runs in one transaction, so the set never ends up half-updated.
- Any role can be edited, `admin` included. Removing `permissions.manage` from a role revokes its own access to this endpoint.
- `bun run seed:roles` restores the seeded defaults.

## Permissions

`GET /api/permissions` lists every permission available in the system (the set seeded by `bun run seed:roles`). Any authenticated user may call it — no extra permission required — so role-management UIs can render slug, name, and description.

```bash
curl -s http://localhost:4000/api/permissions -H "Authorization: Bearer $TOKEN"
```

- `200` → `{ "data": [ { "slug": "rooms.browse", "name": "Browse rooms", "description": "..." }, ... ] }`
- `401` → missing, malformed, invalid, or expired token

The list is ordered by seed order and reflects the current database contents; a permission added or renamed via the seeder shows up on the next request.

## Users

User management endpoints require `Authorization: Bearer <access_token>` and the `users.manage` permission on the caller's role. Responses never expose password hashes.

### List

`GET /api/users`

```bash
curl -s http://localhost:4000/api/users -H "Authorization: Bearer $TOKEN"
```

- `200` → `{ "data": [ { "id": 1, "username": "admin", "name": "Admin", "email": "admin@example.com", "role": "admin" }, ... ] }`
- `401` → missing, malformed, or expired token
- `403` → caller's role lacks `users.manage`

### Get

`GET /api/users/:id`

- `200` → `{ "data": { "id": 1, "username": "admin", "name": "Admin", "email": "admin@example.com", "role": "admin" } }`
- `400` → invalid user ID format
- `404` → user not found

### Create

`POST /api/users` with JSON `{ "username", "email", "password", "role" }`.

```bash
curl -s -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"staff_alex","email":"alex@example.com","password":"secure-pass-123","role":"staff"}'
```

- `201` → `{ "data": { "id": 2, "username": "staff_alex", "name": "staff_alex", "email": "alex@example.com", "role": "staff" } }`
- `400` → body validation failed (password < 8 chars, invalid email, username format, or role does not exist)
- `409` → email or username already in use

### Update

`PATCH /api/users/:id` with optional fields `{ "username", "email", "password", "role" }`.

```bash
curl -s -X PATCH http://localhost:4000/api/users/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"role":"staff"}'
```

- `200` → updated user object
- `400` → invalid fields or no fields provided
- `404` → user not found
- `409` → new email or username is already taken by another user

### Delete

`DELETE /api/users/:id`

```bash
curl -s -X DELETE http://localhost:4000/api/users/2 \
  -H "Authorization: Bearer $TOKEN"
```

- `200` → `{ "data": { "message": "User deleted successfully" } }`
- `404` → user not found

## Room Types

Manage room types (Standard, Deluxe, etc.).

- **Read** requires the `rooms.browse` permission (held by staff, admin).
- **Create, update, and delete** require the `room_types.manage` permission (admin).

Room type ids are UUIDv4 strings, and the `:id` route parameter only accepts that format. A numeric or otherwise malformed id is answered with `400`.

### List

`GET /api/room-types[?capacity_min=N&capacity_max=N]`

```bash
curl -s http://localhost:4000/api/room-types \
  -H "Authorization: Bearer $TOKEN"
```

- `200` → `{ "data": [ { "id": "45be122e-9214-4954-bd40-130f94c8af0f", "name": "Deluxe", "base_price": 750000, "capacity": 2, "description": "...", "amenities": ["WiFi", "AC"], "photos": ["https://..."], "total_rooms": 5 } ] }`

### Get

`GET /api/room-types/:id`

- `200` → single room type object
- `400` → invalid room type ID
- `404` → room type not found

### Create

`POST /api/room-types` with JSON `{ "name", "capacity", "base_price", "description"?, "amenities"?, "photos"? }`.

```bash
curl -s -X POST http://localhost:4000/api/room-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Deluxe Ocean","capacity":2,"base_price":850000,"description":"Ocean view","amenities":["WiFi","Balcony"],"photos":["https://example.com/img.jpg"]}'
```

- `201` → created room type object
- `400` → body validation failed
- `409` → room type name already exists

### Update

`PATCH /api/room-types/:id` with optional fields `{ "name", "capacity", "base_price", "description", "amenities", "photos" }`.

```bash
curl -s -X PATCH http://localhost:4000/api/room-types/45be122e-9214-4954-bd40-130f94c8af0f \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"base_price":900000}'
```

- `200` → updated room type object
- `400` → invalid fields or no fields provided
- `404` → room type not found
- `409` → name already taken by another room type

### Delete

`DELETE /api/room-types/:id`

```bash
curl -s -X DELETE http://localhost:4000/api/room-types/45be122e-9214-4954-bd40-130f94c8af0f \
  -H "Authorization: Bearer $TOKEN"
```

- `200` → `{ "data": { "message": "Room type deleted successfully" } }`
- `404` → room type not found
- `409` → cannot delete room type because physical rooms or reservations reference it

## Public Room Catalog

Read-only room type catalog for the guest page. No token and no permission check, so the same DTO the staff route returns is served to anonymous visitors. Mounted at `/api/public/room-types` and rate limited per client IP (120 requests per 60 seconds, fixed window, in memory).

The staff routes under `/api/room-types` stay behind `requireAuth` and `rooms.browse`.

### List

`GET /api/public/room-types[?capacity_min=N&capacity_max=N]`

```bash
curl -s "http://localhost:4000/api/public/room-types?capacity_min=2"
```

- `200` → `{ "data": [ { "id": "45be122e-9214-4954-bd40-130f94c8af0f", "name": "Deluxe", "base_price": 750000, "capacity": 2, "description": "...", "amenities": ["WiFi", "AC"], "photos": ["https://..."], "total_rooms": 5 } ] }`
- `400` → invalid query parameter
- `429` → rate limit exceeded, retry after the `Retry-After` header value

### Get

`GET /api/public/room-types/:id`

- `200` → single room type object
- `400` → invalid room type ID
- `404` → room type not found
- `429` → rate limit exceeded

## Availability

Search for available room types across a requested date range and party size. Requires the `rooms.browse` permission.

`GET /api/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&guests=N`

```bash
curl -s "http://localhost:4000/api/availability?check_in=2026-10-01&check_out=2026-10-03&guests=2" \
  -H "Authorization: Bearer $TOKEN"
```

- `200` → see the response below
- `400` → missing/invalid date, `check_out <= check_in`, `guests < 1`, or stay exceeds 30 nights
- `401` → missing or invalid access token

```jsonc
{
  "data": {
    "check_in": "2026-10-01",
    "check_out": "2026-10-03",
    "nights": 2,
    "guests": 2,
    "results": [
      {
        "room_type": { ... },
        "available_rooms": 3,
        "price": {
          "nightly": [
            { "date": "2026-10-01", "price": 850000 },
            { "date": "2026-10-02", "price": 850000 }
          ],
          "total": 1700000,
          "average_nightly": 850000
        }
      }
    ]
  }
}
```

How availability is calculated:

- Only room types with `capacity >= guests` and `available_rooms > 0` are returned in `results`.
- Rooms in `maintenance` status are excluded from inventory.
- Active reservations (`pending`, `confirmed`, `checked_in`) overlapping the stay reduce the available rooms per night. The checkout day is non-blocking.
- Active pricing rules (`price_override` or `multiplier`) are applied automatically to calculate nightly rates and the total stay price.

## Payments

Create and track payments for a reservation. All endpoints except the webhook require `Authorization: Bearer <access_token>`; access is limited to the reservation owner or staff/manager/admin. Amounts are in `IDR`.

- **Methods:** `va` (virtual account, requires `bank`) and `qris` (no bank).
- **Statuses:** `pending`, `paid`, `failed`, `expired`.

Rules:

- A reservation must be in `pending_payment` status before a payment can be created.
- Creating a payment with the same method (and bank, for `va`) while an active pending payment exists returns that existing payment.
- A reservation allows at most `PAYMENT_MAX_ATTEMPTS` payments (default 3).
- On `paid`, the reservation becomes `confirmed` and `paid_at` is set.
- On `expired`, if no other pending payment remains, the reservation becomes `cancelled`.
- Each payment expires after `PAYMENT_EXPIRY_MINUTES` minutes (default 15). Expired pending payments are expired lazily on access, and a background sweeper runs every 30 seconds.
- Responses include `expires_at`, `server_time`, and `remaining_seconds` for client-side countdowns.

### Create

`POST /api/payments` with JSON `{ "reservation_id", "method", "bank"? }`.

```bash
curl -s -X POST http://localhost:4000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reservation_id":"...","method":"va","bank":"bca"}'
```

- `201` → payment object (below)
- `400` → body validation failed, or `bank` missing/extra for the method
- `401` → missing, malformed, invalid, or expired token
- `403` → caller does not own the reservation and lacks staff access
- `404` → reservation not found
- `409` → reservation is not in `pending_payment` status, or maximum payment attempts reached

```jsonc
{
  "data": {
    "id", "reservation_id", "amount", "currency": "IDR",
    "method", "bank", "status": "pending",
    "va_number", "qr_string",
    "expires_at", "server_time", "remaining_seconds", "paid_at"
  }
}
```

### Get

`GET /api/payments/:id`

```bash
curl -s http://localhost:4000/api/payments/$PAYMENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

- `200` → payment object (same shape as create); pending payments past expiry are expired lazily
- `401` → missing, malformed, invalid, or expired token
- `403` → caller does not own the reservation and lacks staff access
- `404` → payment not found

### Webhook (mock provider)

`POST /api/payments/webhook/mock` receives provider callbacks. No auth; the body is verified with an HMAC-SHA256 signature.

```bash
curl -s -X POST http://localhost:4000/api/payments/webhook/mock \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d '{"provider_ref":"MOCK-REF-...","status":"paid"}'
```

- `200` → `{ "message": "OK" }`
- `400` → invalid JSON or payload structure
- `401` → invalid signature
- `404` → payment not found

The signature is computed as `HMAC-SHA256(MOCK_WEBHOOK_SECRET, rawBody)` and sent hex-encoded in `x-signature`, `signature`, or `x-mock-signature`.

### Simulate (development only)

`POST /api/payments/:id/simulate` with JSON `{ "result": "paid" | "failed" }` flips a payment's status without a provider callback. Disabled in production (returns `404`). Requires auth and reservation access.

```bash
curl -s -X POST http://localhost:4000/api/payments/$PAYMENT_ID/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"result":"paid"}'
```

- `200` → `{ "message": "OK" }`
- `400` → invalid body
- `401` → missing, malformed, invalid, or expired token
- `403` → caller does not own the reservation and lacks staff access
- `404` → payment not found, or endpoint disabled in production

## Reservations

### My reservations

Returns the authenticated user's own reservations. Requires `Authorization: Bearer <access_token>` and either the `bookings.view_own` or `bookings.view_all` permission.

- Users with only `bookings.view_own` see reservations linked to their account (matched by guest id or email).
- Users with `bookings.view_all` see every reservation.

All of the following aliases behave identically:

- `GET /api/reservations`
- `GET /api/reservations/me`
- `GET /api/reservations/mine`
- `GET /api/reservations/history`

Responses:

- `200` → list of reservations (below)
- `401` → missing, malformed, invalid, or expired token
- `403` → caller lacks both `bookings.view_own` and `bookings.view_all`

```jsonc
{
  "data": [
    {
      "id", "guest_id",
      "guest": { "id", "name", "email", "phone" } | null,
      "guest_name", "guest_email", "guest_phone",
      "room_type_id",
      "room_type": { "id", "name" } | null,
      "room_type_name",
      "room_id",
      "room": { "id", "room_number" } | null,
      "room_number",
      "check_in", "check_out", "status", "total_price", "paid_at"
    }
  ]
}
```

Results are ordered by `id` ascending and are not paginated.

### Get

`GET /api/reservations/:id` returns a single reservation in the same shape, wrapped in `{ "data": ... }`, with the same ownership check for callers without `bookings.view_all`.

- `200` → single reservation object
- `400` → invalid reservation ID
- `401` → missing, malformed, invalid, or expired token
- `403` → access denied to that reservation
- `404` → reservation not found

## Admin Orders

Admin-only full order history. Requires `Authorization: Bearer <access_token>` and the `admin` role.

`GET /api/admin/orders`

```bash
curl -s "http://localhost:4000/api/admin/orders?page=1&limit=20&status=confirmed&payment_method=va&start_date=2026-10-01&end_date=2026-10-31" \
  -H "Authorization: Bearer $TOKEN"
```

Aliases: `/api/orders`, `/api/orders/history`, `/api/reservations/admin/history`, `/api/reservations/history/admin`.

### Query parameters

| Parameter                         | Description                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `page`                            | Page number (default `1`)                                                      |
| `limit`                           | Page size (default `20`, max `100`)                                            |
| `status`                          | Filters reservation status                                                     |
| `payment_method` (alias `method`) | Filters latest payment method (`va`, `qris`)                                   |
| `payment_status`                  | Filters latest payment status                                                  |
| `start_date` / `end_date`         | Filter by order creation date. Aliases: `date_from` / `date_to`, `from` / `to` |
| `check_in_from` / `check_in_to`   | Filter by check-in date                                                        |

### Response

```jsonc
{
  "data": [
    {
      "id", "order_date", "status", "check_in", "check_out", "total_price",
      "currency": "IDR",
      "customer": { "id", "name", "email", "phone" },
      "room": { "id", "room_number" },
      "room_type": { "id", "name", "type", "capacity", "base_price", "amenities" },
      "payment": { "id", "method", "bank", "status", "amount", "paid_at", "created_at" } | null,
      "payment_method",
      "payment_status"
    }
  ],
  "meta": { "page", "limit", "total", "total_pages", "filters" }
}
```

### Relations

- `reservations.guest_id` → `guests.id`
- `reservations.room_id` → `rooms.id`
- `reservations.room_type_id` → `room_types.id`
- latest `payments.reservation_id` → `reservations.id`

---

## Known limitations

- Access tokens cannot be revoked before they expire.
- Login and the staff routes still have no brute-force protection; add a rate limit or lockout there before public deployment.
- Rate limits (register and the public room catalog) are kept in the API process memory. They reset on deploy and do not span multiple instances.
- The payment expiry sweeper runs in-process every 30 seconds. It resets on deploy and does not span multiple instances.
- Payments use the mock provider by default (`PAYMENT_PROVIDER=mock`). The provider is swappable, but only `mock` is implemented. Webhook callbacks are verified with `MOCK_WEBHOOK_SECRET`.
