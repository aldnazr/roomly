import { query } from "../../db";
import type {
  PermissionRecord,
  PermissionRepository,
} from "../application/ports";

export class LibsqlPermissionRepository implements PermissionRepository {
  async list(): Promise<PermissionRecord[]> {
    return query<PermissionRecord>(
      "SELECT slug, name, description FROM permissions ORDER BY id",
    );
  }
}
