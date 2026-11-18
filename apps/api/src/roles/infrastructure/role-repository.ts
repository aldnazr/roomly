import { db, query, queryOne } from "../db";
import type { RoleRepository, RoleRecord } from "./application/ports";
import { HttpError } from "../errors";
import { NotFoundError, ValidationError } from "../shared/domain/errors";

export class LibsqlRoleRepository implements RoleRepository {
  async listRoles(): Promise<RoleRecord[]> {
    const mapped = await query<{ slug: string; permission_slug: string }>(
      `SELECT r.slug, p.slug AS permission_slug
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
       ORDER BY r.id, p.id`,
    );

    const grouped = new Map<string, string[]>();
    for (const row of mapped) {
      const list = grouped.get(row.slug);
      if (list) list.push(row.permission_slug);
      else grouped.set(row.slug, [row.permission_slug]);
    }

    const roles = await query<{ slug: string; name: string; description: string }>(
      "SELECT slug, name, description FROM roles ORDER BY id",
    );

    return roles.map((role) => ({ ...role, permissions: grouped.get(role.slug) ?? [] }));
  }

  async getRole(slug: string): Promise<RoleRecord | null> {
    const role = await queryOne<{ slug: string; name: string; description: string }>(
      "SELECT slug, name, description FROM roles WHERE slug = ?",
      [slug],
    );
    if (!role) return null;

    const permissions = (
      await query<{ permission_slug: string }>(
        `SELECT p.slug AS permission_slug
         FROM role_permissions rp
         JOIN roles r ON r.id = rp.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE r.slug = ?
         ORDER BY p.id`,
        [slug],
      )
    ).map((row) => row.permission_slug);

    return { ...role, permissions };
  }

  async listPermissionSlugs(): Promise<string[]> {
    return (await query<{ slug: string }>("SELECT slug FROM permissions")).map((p) => p.slug);
  }

  async setRolePermissions(slug: string, permissionSlugs: string[]): Promise<RoleRecord> {
    const role = await queryOne<{ id: number }>("SELECT id FROM roles WHERE slug = ?", [slug]);
    if (!role) throw new NotFoundError("Role not found");

    const known = new Set(await this.listPermissionSlugs());
    const unknown = permissionSlugs.filter((permissionSlug) => !known.has(permissionSlug));
    if (unknown.length > 0) {
      throw new ValidationError(`Unknown permission slugs: ${unknown.join(", ")}`);
    }

    await db.batch(
      [
        {
          sql: "DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE slug = ?)",
          args: [slug],
        },
        ...permissionSlugs.map((permissionSlug) => ({
          sql: `INSERT INTO role_permissions (role_id, permission_id)
                SELECT roles.id, permissions.id
                FROM roles, permissions
                WHERE roles.slug = ? AND permissions.slug = ?`,
          args: [slug, permissionSlug],
        })),
      ],
      "write",
    );

    const updated = await this.getRole(slug);
    if (!updated) throw new NotFoundError("Role not found");
    return updated;
  }
}