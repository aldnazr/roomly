export type PermissionRecord = {
  slug: string;
  name: string;
  description: string;
};

export interface PermissionRepository {
  list(): Promise<PermissionRecord[]>;
}