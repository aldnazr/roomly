import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../shared/application/infrastructure-ports";

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 12);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
