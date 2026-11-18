import { NotFoundError, ValidationError } from "../../shared/domain/errors";
import type { RoleRecord, RoleRepository } from "./ports";

function assertRoleSlug(slug: string): string {
  const cleaned = slug.trim();
  if (!cleaned) throw new ValidationError("Invalid role slug");
  return cleaned;
}

export class RoleService {
  constructor(private readonly repository: RoleRepository) {}

  async listRoles(): Promise<RoleRecord[]> {
    return this.repository.listRoles();
  }

  async getRole(slug: string): Promise<RoleRecord> {
    const cleaned = assertRoleSlug(slug);
    const role = await this.repository.getRole(cleaned);
    if (!role) throw new NotFoundError("Role not found");
    return role;
  }

  async setRolePermissions(
    slug: string,
    permissionSlugs: string[],
  ): Promise<RoleRecord> {
    const cleaned = assertRoleSlug(slug);
    return this.repository.setRolePermissions(cleaned, permissionSlugs);
  }
}
