import { Clock } from "../shared/application/infrastructure-ports";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
