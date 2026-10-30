import { expireStalePayments } from "./service";

let timer: ReturnType<typeof setInterval> | null = null;

export function startExpirySweeper(intervalMs = 30000): void {
  if (timer) return; // guard against double start
  timer = setInterval(async () => {
    try {
      await expireStalePayments();
    } catch (err) {
      console.error("Error in expiry sweeper:", err);
    }
  }, intervalMs);
}

export function stopExpirySweeper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
