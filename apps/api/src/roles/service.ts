import { LibsqlRoleRepository } from "./infrastructure/role-repository";
import { RoleService } from "./application/use-cases";

const service = new RoleService(new LibsqlRoleRepository());

export type RoleDto = {
  slug: string;
  name: string;
  description: string;
  permissions: string[];
};

export async function listRoles() {
  return service.listRoles();
}

export async function getRole(slug: string) {
  return service.getRole(slug);
}

export async function setRolePermissions(slug: string, permissionSlugs: string[]) {
  return service.setRolePermissions(slug, permissionSlugs);
}
