import type { Request, RequestHandler } from "express";
import { HttpError } from "../errors";

type Window = { count: number; resetAt: number };

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  message?: string;
};

const windows = new Map<string, Window>();
let lastPruneAt = 0;

function clientKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

function prune(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  lastPruneAt = now;
}

// Fixed window counter per client IP. Cheap and dependency free, so it only
// guards the public catalog; it is not a substitute for a shared store when
// the API runs on more than one instance.
export function rateLimit({
  limit,
  windowMs,
  message,
}: RateLimitOptions): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const key = clientKey(req);
    const window = windows.get(key);

    if (!window || window.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      if (now - lastPruneAt >= windowMs) prune(now);
      next();
      return;
    }

    window.count += 1;

    if (window.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      next(
        new HttpError(
          429,
          message ?? `Too many requests. Retry in ${retryAfter} seconds.`,
        ),
      );
      return;
    }

    next();
  };
}
