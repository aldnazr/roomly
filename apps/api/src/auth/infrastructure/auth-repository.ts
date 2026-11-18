import { query, queryOne } from "../../db";
import type { AuthRepository } from "../application/ports";

export class LibsqlAuthRepository implements AuthRepository {
  async findByIdentifier(identifier: string) {
    return queryOne<{
      id: number;
      name: string;
      username: string | null;
      email: string;
      role: string;
      password_hash: string | null;
    }>(
      "SELECT id, name, username, email, role, password_hash FROM users WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE",
      [identifier, identifier],
    );
  }

  async getCurrentUser(userId: number) {
    return queryOne<{
      id: number;
      username: string | null;
      name: string;
      email: string;
      role_slug: string;
      role_name: string;
      role_description: string;
    }>(
      `SELECT
         u.id,
         u.username,
         u.name,
         u.email,
         r.slug AS role_slug,
         r.name AS role_name,
         r.description AS role_description
       FROM users u
       JOIN roles r ON r.slug = u.role
       WHERE u.id = ?`,
      [userId],
    );
  }

  async listPermissions(roleSlug: string): Promise<string[]> {
    const rows = await query<{ slug: string }>(
      `SELECT p.slug
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
       WHERE r.slug = ?
       ORDER BY p.id`,
      [roleSlug],
    );
    return rows.map((row) => row.slug);
  }

  async findUserByEmail(email: string) {
    return queryOne<{ id: number }>(
      "SELECT id FROM users WHERE email = ? COLLATE NOCASE",
      [email],
    );
  }

  async guestRoleExists(): Promise<boolean> {
    const role = await queryOne<{ id: number }>(
      "SELECT id FROM roles WHERE slug = ?",
      ["guest"],
    );
    return !!role;
  }

  async createGuest(input: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const result = await queryOne<{
      id: number;
      name: string;
      email: string;
      role: string;
    }>(
      `INSERT INTO users (name, email, role, password_hash)
       VALUES (?, ?, ?, ?)
       RETURNING id, name, email, role`,
      [input.name, input.email, "guest", input.passwordHash],
    );
    return result!;
  }

  async hasPermission(
    roleSlug: string,
    permissionSlug: string,
  ): Promise<boolean> {
    const row = await queryOne<{ granted: number }>(
      `SELECT 1 AS granted
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE r.slug = ? AND p.slug = ?`,
      [roleSlug, permissionSlug],
    );
    return !!row;
  }
}
