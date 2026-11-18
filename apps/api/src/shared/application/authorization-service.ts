export interface PermissionRepository {
  hasPermission(roleSlug: string, permissionSlug: string): Promise<boolean>;
}

export class AuthorizationService {
  constructor(private readonly repository: PermissionRepository) {}

  async hasPermission(roleSlug: string, permissionSlug: string): Promise<boolean> {
    return this.repository.hasPermission(roleSlug, permissionSlug);
  }
}
