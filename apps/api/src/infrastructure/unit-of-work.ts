import type { UnitOfWork } from "../shared/application/infrastructure-ports";

export class PassThroughUnitOfWork implements UnitOfWork {
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
