import { randomUUID } from "node:crypto";
import type { IdGenerator } from "../shared/application/infrastructure-ports";

export class CryptoIdGenerator implements IdGenerator {
  newId(): string {
    return randomUUID();
  }
}
