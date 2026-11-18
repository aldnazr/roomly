import { randomUUID } from "node:crypto";
import { IdGenerator } from "../shared/application/infrastructure-ports";

export class CryptoIdGenerator implements IdGenerator {
  newId(): string {
    return randomUUID();
  }
}
