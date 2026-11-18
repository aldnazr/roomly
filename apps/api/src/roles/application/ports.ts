export type RoleRecord = {
  slug: string;
  name: string;
  description: string;
  permissions: string[];
};

export interface RoleRepository {
  listRoles(): Promise<RoleRecord[]>;
  getRole(slug: string): Promise<RoleRecord | null>;
  setRolePermissions(slug: string, permissionSlugs: string[]): Promise<RoleRecord>;
  listPermissionSlugs(): Promise<string[]>;
}
