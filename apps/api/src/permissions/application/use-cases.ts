import type { PermissionRepository, PermissionRecord } from "./ports";

export class PermissionService {
  constructor(private readonly repository: PermissionRepository) {}
  async listPermissions(): Promise<PermissionRecord[]> {
    return this.repository.list();
  }
}