import { createClient, type Client, type InValue, type ResultSet } from "@libsql/client";
import { isUuid, newId } from "./ids";

const url = process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error("Invalid configuration: TURSO_DATABASE_URL must be set");
}

// Works with both a remote Turso instance (libsql://) and a local file (file:) for tests.
export const db: Client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

if (url.startsWith("file:")) {
  await db.execute("PRAGMA foreign_keys = ON;");
}

export async function query<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await db.execute({ sql, args });
  return result.rows.map(
    (row) => Object.fromEntries(result.columns.map((column, i) => [column, row[i]])) as T,
  );
}

export async function queryOne<T>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function exec(sql: string, args: InValue[] = []): Promise<ResultSet> {
  return db.execute({ sql, args });
}

// ponytail: SQLite has no uuid type, so room and room type ids are TEXT
// guarded by a GLOB check that only accepts canonical lowercase UUIDv4 values.
const UUID_GLOB = [
  "[0-9a-f]".repeat(8),
  "[0-9a-f]".repeat(4),
  "4[0-9a-f][0-9a-f][0-9a-f]",
  "[89ab][0-9a-f][0-9a-f][0-9a-f]",
  "[0-9a-f]".repeat(12),
].join("-");

type TableRefs = {
  ifNotExists?: boolean;
  /** Column type of the room type foreign key: INTEGER before the uuid migration, TEXT after. */
  roomTypeIdType?: "INTEGER" | "TEXT";
  /** Table the room type foreign key points at, used while tables are rebuilt under a temp name. */
  roomTypeRef?: string;
};

const roomTypesTableSql = (table: string, ifNotExists = false) => `
    CREATE TABLE ${ifNotExists ? "IF NOT EXISTS " : ""}${table} (
      id TEXT PRIMARY KEY CHECK(id GLOB '${UUID_GLOB}'),
      name TEXT NOT NULL UNIQUE CHECK(length(trim(name)) > 0),
      base_price INTEGER NOT NULL CHECK(base_price >= 0),
      capacity INTEGER NOT NULL CHECK(capacity > 0),
      description TEXT CHECK(description IS NULL OR length(trim(description)) > 0),
      amenities TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(amenities) AND json_type(amenities) = 'array'),
      photos TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(photos) AND json_type(photos) = 'array')
    ) STRICT;`;

const roomsTableSql = (
  table: string,
  { ifNotExists = false, roomTypeIdType = "INTEGER", roomTypeRef = "room_types" }: TableRefs = {},
) => `
    CREATE TABLE ${ifNotExists ? "IF NOT EXISTS " : ""}${table} (
      id TEXT PRIMARY KEY CHECK(id GLOB '${UUID_GLOB}'),
      room_type_id ${roomTypeIdType} NOT NULL REFERENCES ${roomTypeRef}(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      room_number TEXT NOT NULL UNIQUE CHECK(length(trim(room_number)) > 0),
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance')),
      UNIQUE(id, room_type_id)
    ) STRICT;`;

const reservationsTableSql = (
  table: string,
  {
    ifNotExists = false,
    roomTypeIdType = "INTEGER",
    roomTypeRef = "room_types",
    roomsRef = "rooms",
  }: TableRefs & { roomsRef?: string } = {},
) => `
    CREATE TABLE ${ifNotExists ? "IF NOT EXISTS " : ""}${table} (
      id INTEGER PRIMARY KEY,
      guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      room_type_id ${roomTypeIdType} NOT NULL REFERENCES ${roomTypeRef}(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      room_id TEXT CHECK(room_id IS NULL OR room_id GLOB '${UUID_GLOB}'),
      check_in TEXT NOT NULL CHECK(
        length(check_in) = 10 AND
        check_in GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND
        date(check_in, '+0 days') IS NOT NULL AND
        date(check_in, '+0 days') = check_in
      ),
      check_out TEXT NOT NULL CHECK(
        length(check_out) = 10 AND
        check_out GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND
        date(check_out, '+0 days') IS NOT NULL AND
        date(check_out, '+0 days') = check_out
      ),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
      total_price INTEGER NOT NULL CHECK(total_price >= 0),
      CHECK(check_out > check_in),
      CHECK(status NOT IN ('checked_in', 'checked_out') OR room_id IS NOT NULL),
      FOREIGN KEY(room_id, room_type_id) REFERENCES ${roomsRef}(id, room_type_id) ON DELETE RESTRICT ON UPDATE RESTRICT
    ) STRICT;`;

const pricingRulesTableSql = (
  table: string,
  { ifNotExists = false, roomTypeIdType = "INTEGER", roomTypeRef = "room_types" }: TableRefs = {},
) => `
    CREATE TABLE ${ifNotExists ? "IF NOT EXISTS " : ""}${table} (
      id INTEGER PRIMARY KEY,
      room_type_id ${roomTypeIdType} NOT NULL REFERENCES ${roomTypeRef}(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      start_date TEXT NOT NULL CHECK(
        length(start_date) = 10 AND
        start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND
        date(start_date, '+0 days') IS NOT NULL AND
        date(start_date, '+0 days') = start_date
      ),
      end_date TEXT NOT NULL CHECK(
        length(end_date) = 10 AND
        end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND
        date(end_date, '+0 days') IS NOT NULL AND
        date(end_date, '+0 days') = end_date
      ),
      price_override INTEGER CHECK(price_override IS NULL OR price_override >= 0),
      multiplier REAL CHECK(multiplier IS NULL OR multiplier > 0),
      CHECK(end_date >= start_date),
      CHECK(
        (price_override IS NOT NULL AND multiplier IS NULL) OR
        (price_override IS NULL AND multiplier IS NOT NULL)
      )
    ) STRICT;`;

const ROOM_RELATED_INDEX_SQL = `
    CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms(room_type_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_room_type_id ON reservations(room_type_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_room_dates ON reservations(room_id, check_in, check_out);`;

const PRICING_RULE_INDEX_SQL = `
    CREATE INDEX IF NOT EXISTS idx_pricing_rules_room_type_dates ON pricing_rules(room_type_id, start_date, end_date);`;

const RESERVATION_TRIGGER_SQL = `
    CREATE TRIGGER IF NOT EXISTS trg_reservations_insert_no_overlap
    BEFORE INSERT ON reservations
    WHEN NEW.room_id IS NOT NULL AND NEW.status IN ('pending', 'confirmed', 'checked_in')
    BEGIN
      SELECT RAISE(ABORT, 'Reservation overlaps an active booking for this room')
      WHERE EXISTS (
        SELECT 1 FROM reservations
        WHERE room_id = NEW.room_id
          AND status IN ('pending', 'confirmed', 'checked_in')
          AND NEW.check_in < check_out
          AND NEW.check_out > check_in
      );
    END;

    CREATE TRIGGER IF NOT EXISTS trg_reservations_update_no_overlap
    BEFORE UPDATE ON reservations
    WHEN NEW.room_id IS NOT NULL AND NEW.status IN ('pending', 'confirmed', 'checked_in')
    BEGIN
      SELECT RAISE(ABORT, 'Reservation overlaps an active booking for this room')
      WHERE EXISTS (
        SELECT 1 FROM reservations
        WHERE room_id = NEW.room_id
          AND id <> OLD.id
          AND status IN ('pending', 'confirmed', 'checked_in')
          AND NEW.check_in < check_out
          AND NEW.check_out > check_in
      );
    END;`;

const PRICING_RULE_TRIGGER_SQL = `
    CREATE TRIGGER IF NOT EXISTS trg_pricing_rules_insert_no_overlap
    BEFORE INSERT ON pricing_rules
    BEGIN
      SELECT RAISE(ABORT, 'Pricing rule overlaps another rule for this room type')
      WHERE EXISTS (
        SELECT 1 FROM pricing_rules
        WHERE room_type_id = NEW.room_type_id
          AND NEW.start_date <= end_date
          AND NEW.end_date >= start_date
      );
    END;

    CREATE TRIGGER IF NOT EXISTS trg_pricing_rules_update_no_overlap
    BEFORE UPDATE ON pricing_rules
    BEGIN
      SELECT RAISE(ABORT, 'Pricing rule overlaps another rule for this room type')
      WHERE EXISTS (
        SELECT 1 FROM pricing_rules
        WHERE room_type_id = NEW.room_type_id
          AND id <> OLD.id
          AND NEW.start_date <= end_date
          AND NEW.end_date >= start_date
      );
    END;`;

type Migration = { id: number; name: string; up: (db: Client) => Promise<void> };

// ponytail: libsql rejects "PRAGMA legacy_alter_table = OFF", but the read
// form is allowed and modern SQLite already defaults to off. Legacy mode
// would leave foreign keys pointing at the temporary table names after a
// rename, so fail loudly instead of writing a broken schema.
async function assertModernRenameSemantics(db: Client): Promise<void> {
  const result = await db.execute("PRAGMA legacy_alter_table");
  const value = result.rows[0] ? Object.values(result.rows[0])[0] : 0;
  if (Number(value) === 1) {
    throw new Error("SQLite runs in legacy_alter_table mode; table renames would not rewrite foreign key references");
  }
}

type LegacyRoomTypeRow = {
  id: number;
  name: string;
  base_price: number;
  capacity: number;
  description: string | null;
  amenities: string | null;
  photos: string | null;
};

type LegacyIntegerRoomRow = {
  id: number;
  room_type_id: number;
  room_number: string;
  status: string;
};

type LegacyIntegerReservationRow = {
  id: number;
  guest_id: number;
  room_type_id: number;
  room_id: number | null;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
};

type LegacyRoomRow = {
  id: number | string;
  room_type_id: number | string;
  room_number: string;
  status: string;
};

type LegacyReservationRow = {
  id: number;
  guest_id: number;
  room_type_id: number | string;
  room_id: number | string | null;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
};

type LegacyPricingRuleRow = {
  id: number;
  room_type_id: number | string;
  start_date: string;
  end_date: string;
  price_override: number | null;
  multiplier: number | null;
};

const migrations: Migration[] = [
  {
    id: 1,
    name: "initial_schema",
    up: (db) => {
      return db.executeMultiple(`
    ${roomTypesTableSql("room_types", true)}

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      email TEXT CHECK(email IS NULL OR length(trim(email)) > 0),
      phone TEXT CHECK(phone IS NULL OR length(trim(phone)) > 0)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE CHECK(length(trim(slug)) > 0),
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      description TEXT NOT NULL CHECK(length(trim(description)) > 0)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE CHECK(length(trim(slug)) > 0),
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      description TEXT NOT NULL CHECK(length(trim(description)) > 0)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE ON UPDATE RESTRICT,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE RESTRICT,
      PRIMARY KEY(role_id, permission_id)
    ) STRICT, WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      email TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK(length(trim(email)) > 0),
      role TEXT NOT NULL DEFAULT 'guest' REFERENCES roles(slug) ON DELETE RESTRICT ON UPDATE CASCADE
    ) STRICT;

    ${roomsTableSql("rooms", { ifNotExists: true, roomTypeIdType: "TEXT" })}

    ${reservationsTableSql("reservations", { ifNotExists: true, roomTypeIdType: "TEXT" })}

    ${pricingRulesTableSql("pricing_rules", { ifNotExists: true, roomTypeIdType: "TEXT" })}

    ${ROOM_RELATED_INDEX_SQL}
    ${PRICING_RULE_INDEX_SQL}

    ${RESERVATION_TRIGGER_SQL}
    ${PRICING_RULE_TRIGGER_SQL}
  `);
    },
  },
  {
    id: 2,
    name: "users_add_password_hash",
    up: async (db) => {
      const columns = await db.execute("PRAGMA table_info(users)");
      const names = columns.rows.map((row) => row.name as string);
      if (!names.includes("password_hash")) {
        await db.execute("ALTER TABLE users ADD COLUMN password_hash TEXT");
      }
    },
  },
  {
    id: 3,
    name: "users_add_username",
    up: async (db) => {
      const columns = await db.execute("PRAGMA table_info(users)");
      const names = columns.rows.map((row) => row.name as string);
      if (!names.includes("username")) {
        await db.execute("ALTER TABLE users ADD COLUMN username TEXT");
        // ponytail: unique index allows multiple legacy NULLs; API enforces required on write.
        await db.execute(
          "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL",
        );
      }
    },
  },
  {
    id: 4,
    name: "room_types_add_amenities_photos",
    up: async (db) => {
      const columns = await db.execute("PRAGMA table_info(room_types)");
      const names = columns.rows.map((row) => row.name as string);
      if (!names.includes("amenities")) {
        await db.execute(
          "ALTER TABLE room_types ADD COLUMN amenities TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(amenities) AND json_type(amenities) = 'array')",
        );
      }
      if (!names.includes("photos")) {
        await db.execute(
          "ALTER TABLE room_types ADD COLUMN photos TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(photos) AND json_type(photos) = 'array')",
        );
      }
    },
  },
  {
    id: 5,
    name: "remove_guest_manager_roles",
    up: async (db) => {
      await db.execute("DELETE FROM users WHERE role IN ('guest', 'manager')");

      // ponytail: SQLite cannot drop a column default in place; rebuild the table.
      await db.executeMultiple(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL CHECK(length(trim(name)) > 0),
          email TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK(length(trim(email)) > 0),
          role TEXT NOT NULL REFERENCES roles(slug) ON DELETE RESTRICT ON UPDATE CASCADE,
          password_hash TEXT,
          username TEXT
        ) STRICT;
        INSERT INTO users_new (id, name, email, role, password_hash, username)
          SELECT id, name, email, role, password_hash, username FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
        PRAGMA foreign_keys = ON;
      `);

      await db.execute("DELETE FROM roles WHERE slug IN ('guest', 'manager')");
    },
  },
  {
    id: 6,
    name: "rooms_use_uuid_ids",
    up: async (db) => {
      const columns = await db.execute("PRAGMA table_info(rooms)");
      const idColumn = columns.rows.find((row) => row.name === "id");
      if (idColumn?.type === "TEXT") return;

      const rooms = (await db.execute("SELECT id, room_type_id, room_number, status FROM rooms"))
        .rows as unknown as LegacyIntegerRoomRow[];
      const reservations = (
        await db.execute(
          "SELECT id, guest_id, room_type_id, room_id, check_in, check_out, status, total_price FROM reservations",
        )
      ).rows as unknown as LegacyIntegerReservationRow[];

      const idMap = new Map<number, string>();
      for (const row of rooms) {
        idMap.set(row.id, newId());
      }

      // ponytail: the copy runs with foreign keys off so legacy rows that no
      // longer resolve cannot abort the rebuild; the final check below proves
      // the rebuilt schema is consistent.
      await db.execute("PRAGMA foreign_keys = OFF");
      await assertModernRenameSemantics(db);

      // The new reservations table points at rooms_new so the rows can be copied
      // before the old tables are dropped; renaming rooms_new rewrites that
      // reference to the final table name.
      await db.executeMultiple(`
        ${roomsTableSql("rooms_new")}
        ${reservationsTableSql("reservations_new", { roomsRef: "rooms_new" })}
      `);

      for (const row of rooms) {
        await db.execute({
          sql: "INSERT INTO rooms_new (id, room_type_id, room_number, status) VALUES (?, ?, ?, ?)",
          args: [idMap.get(row.id)!, row.room_type_id, row.room_number, row.status],
        });
      }

      for (const row of reservations) {
        const legacyRoomId = row.room_id;
        await db.execute({
          sql: `INSERT INTO reservations_new (id, guest_id, room_type_id, room_id, check_in, check_out, status, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            row.id,
            row.guest_id,
            row.room_type_id,
            legacyRoomId === null ? null : idMap.get(legacyRoomId)!,
            row.check_in,
            row.check_out,
            row.status,
            row.total_price,
          ],
        });
      }

      await db.executeMultiple(`
        DROP TABLE reservations;
        DROP TABLE rooms;
      `);

      await db.execute("PRAGMA foreign_keys = ON");
      await db.executeMultiple(`
        ALTER TABLE rooms_new RENAME TO rooms;
        ALTER TABLE reservations_new RENAME TO reservations;
      `);
      await db.executeMultiple(`${ROOM_RELATED_INDEX_SQL} ${RESERVATION_TRIGGER_SQL}`);

      const violations = await db.execute("PRAGMA foreign_key_check");
      if (violations.rows.length > 0) {
        throw new Error("rooms_use_uuid_ids left foreign key violations behind");
      }
    },
  },
  {
    id: 7,
    name: "room_types_use_uuid_ids",
    up: async (db) => {
      const columns = await db.execute("PRAGMA table_info(room_types)");
      if (columns.rows.find((row) => row.name === "id")?.type === "TEXT") return;

      const roomTypes = (
        await db.execute(
          "SELECT id, name, base_price, capacity, description, amenities, photos FROM room_types",
        )
      ).rows as unknown as LegacyRoomTypeRow[];
      const rooms = (
        await db.execute("SELECT id, room_type_id, room_number, status FROM rooms")
      ).rows as unknown as LegacyRoomRow[];
      const reservations = (
        await db.execute(
          "SELECT id, guest_id, room_type_id, room_id, check_in, check_out, status, total_price FROM reservations",
        )
      ).rows as unknown as LegacyReservationRow[];
      const pricingRules = (
        await db.execute(
          "SELECT id, room_type_id, start_date, end_date, price_override, multiplier FROM pricing_rules",
        )
      ).rows as unknown as LegacyPricingRuleRow[];

      const roomTypeIds = new Map<string, string>();
      for (const row of roomTypes) {
        roomTypeIds.set(String(row.id), newId());
      }

      // Rooms already carry uuid ids once rooms_use_uuid_ids has run, but a
      // database that skipped it still holds integer room ids.
      const roomIds = new Map<string, string>();
      for (const row of rooms) {
        const id = typeof row.id === "string" && isUuid(row.id) ? row.id : newId();
        roomIds.set(String(row.id), id);
      }

      const roomTypeId = (legacyId: number | string, owner: string): string => {
        const mapped = roomTypeIds.get(String(legacyId));
        if (!mapped) {
          throw new Error(
            `room_types_use_uuid_ids: ${owner} references missing room type ${legacyId}`,
          );
        }
        return mapped;
      };

      // ponytail: the copy runs with foreign keys off so legacy rows that no
      // longer resolve cannot abort the rebuild; the final check below proves
      // the rebuilt schema is consistent.
      await db.execute("PRAGMA foreign_keys = OFF");
      await assertModernRenameSemantics(db);

      // The rebuilt tables point at the temporary names so the rows can be
      // copied before the old tables are dropped; renaming them rewrites those
      // references to the final table names.
      await db.executeMultiple(`
        ${roomTypesTableSql("room_types_new")}
        ${roomsTableSql("rooms_new", { roomTypeIdType: "TEXT", roomTypeRef: "room_types_new" })}
        ${reservationsTableSql("reservations_new", { roomTypeIdType: "TEXT", roomTypeRef: "room_types_new", roomsRef: "rooms_new" })}
        ${pricingRulesTableSql("pricing_rules_new", { roomTypeIdType: "TEXT", roomTypeRef: "room_types_new" })}
      `);

      for (const row of roomTypes) {
        await db.execute({
          sql: "INSERT INTO room_types_new (id, name, base_price, capacity, description, amenities, photos) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [
            roomTypeIds.get(String(row.id))!,
            row.name,
            row.base_price,
            row.capacity,
            row.description,
            row.amenities ?? "[]",
            row.photos ?? "[]",
          ],
        });
      }

      for (const row of rooms) {
        await db.execute({
          sql: "INSERT INTO rooms_new (id, room_type_id, room_number, status) VALUES (?, ?, ?, ?)",
          args: [
            roomIds.get(String(row.id))!,
            roomTypeId(row.room_type_id, `room ${row.room_number}`),
            row.room_number,
            row.status,
          ],
        });
      }

      for (const row of reservations) {
        const legacyRoomId = row.room_id;
        await db.execute({
          sql: `INSERT INTO reservations_new (id, guest_id, room_type_id, room_id, check_in, check_out, status, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            row.id,
            row.guest_id,
            roomTypeId(row.room_type_id, `reservation ${row.id}`),
            legacyRoomId === null ? null : roomIds.get(String(legacyRoomId)) ?? null,
            row.check_in,
            row.check_out,
            row.status,
            row.total_price,
          ],
        });
      }

      for (const row of pricingRules) {
        await db.execute({
          sql: `INSERT INTO pricing_rules_new (id, room_type_id, start_date, end_date, price_override, multiplier)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            row.id,
            roomTypeId(row.room_type_id, `pricing rule ${row.id}`),
            row.start_date,
            row.end_date,
            row.price_override,
            row.multiplier,
          ],
        });
      }

      await db.executeMultiple(`
        DROP TABLE reservations;
        DROP TABLE rooms;
        DROP TABLE pricing_rules;
        DROP TABLE room_types;
      `);

      await db.execute("PRAGMA foreign_keys = ON");
      await db.executeMultiple(`
        ALTER TABLE room_types_new RENAME TO room_types;
        ALTER TABLE rooms_new RENAME TO rooms;
        ALTER TABLE reservations_new RENAME TO reservations;
        ALTER TABLE pricing_rules_new RENAME TO pricing_rules;
      `);
      await db.executeMultiple(
        `${ROOM_RELATED_INDEX_SQL} ${PRICING_RULE_INDEX_SQL} ${RESERVATION_TRIGGER_SQL} ${PRICING_RULE_TRIGGER_SQL}`,
      );

      const violations = await db.execute("PRAGMA foreign_key_check");
      if (violations.rows.length > 0) {
        throw new Error("room_types_use_uuid_ids left foreign key violations behind");
      }
    },
  },
];

export async function migrate(database: Client = db): Promise<void> {
  await database.executeMultiple(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE CHECK(length(trim(name)) > 0),
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    ) STRICT;
  `);

  // ponytail: keyed by name, not id — ids get reused when migrations are
  // renumbered; upsert on id so a stale row from an old numbering is replaced.
  const applied = new Set(
    (await database.execute("SELECT name FROM schema_migrations")).rows.map(
      (row) => row.name as string,
    ),
  );

  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    await migration.up(database);
    await database.execute({
      sql: `INSERT INTO schema_migrations (id, name) VALUES (?, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
      args: [migration.id, migration.name],
    });
  }
}
