import { db, query, queryOne } from "../../db";
import type { UserRepository, UserRecord } from "../application/ports";
import { NotFoundError } from "../../shared/domain/errors";

export class LibsqlUserRepository implements UserRepository {
  async list(): Promise<UserRecord[]> {
    return query<UserRecord>("SELECT id, username, name, email, role FROM users ORDER BY id ASC");
  }

  async getById(id: number): Promise<UserRecord | null> {
    return queryOne<UserRecord>("SELECT id, username, name, email, role FROM users WHERE id = ?", [id]);
  }

  async create(input: {
    username: string;
    email: string;
    role: string;
    passwordHash: string;
  }): Promise<UserRecord> {
    const result = await queryOne<UserRecord>(
      `INSERT INTO users (username, name, email, role, password_hash)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, username, name, email, role`,
      [input.username, input.username, input.email, input.role, input.passwordHash],
    );
    return result!;
  }

  async update(
    id: number,
    input: {
      username?: string;
      email?: string;
      role?: string;
      passwordHash?: string;
    },
  ): Promise<UserRecord> {
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (input.username !== undefined) {
      updates.push("username = ?", "name = ?");
      params.push(input.username, input.username);
    }
    if (input.email !== undefined) {
      updates.push("email = ?");
      params.push(input.email);
    }
    if (input.role !== undefined) {
      updates.push("role = ?");
      params.push(input.role);
    }
    if (input.passwordHash !== undefined) {
      updates.push("password_hash = ?");
      params.push(input.passwordHash);
    }

    params.push(id);
    await db.execute({ sql: `UPDATE users SET ${updates.join(", ")} WHERE id = ?`, args: params });
    const updated = await this.getById(id);
    if (!updated) throw new NotFoundError("User not found");
    return updated;
  }

  async delete(id: number): Promise<void> {
    await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
  }

  async roleExists(roleSlug: string): Promise<boolean> {
    const role = await queryOne<{ id: number }>("SELECT id FROM roles WHERE slug = ?", [roleSlug]);
    return !!role;
  }

  async findByEmail(email: string, excludeUserId?: number): Promise<UserRecord | null> {
    const row = await queryOne<UserRecord>(
      "SELECT id, username, name, email, role FROM users WHERE email = ? COLLATE NOCASE",
      [email],
    );
    if (row && excludeUserId !== undefined && row.id === excludeUserId) return null;
    return row;
  }

  async findByUsername(username: string, excludeUserId?: number): Promise<UserRecord | null> {
    const row = await queryOne<UserRecord>(
      "SELECT id, username, name, email, role FROM users WHERE username = ? COLLATE NOCASE",
      [username],
    );
    if (row && excludeUserId !== undefined && row.id === excludeUserId) return null;
    return row;
  }
}
