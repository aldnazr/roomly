import type { RequestHandler } from "express";
import { HttpError } from "../errors";
import { JoseTokenIssuer } from "../infrastructure/token-issuer";
import { LibsqlAuthRepository } from "./infrastructure/auth-repository";
import { AuthorizationService } from "../shared/application/authorization-service";

export type AuthUser = { id: number; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const tokenIssuer = new JoseTokenIssuer();
const authorizationService = new AuthorizationService(new LibsqlAuthRepository());

const INVALID_TOKEN = "Invalid or expired access token";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? "");
    const token = match?.[1];
    if (!token) throw new HttpError(401, "Missing or malformed Authorization header");

    const claims = await tokenIssuer.verify(token);
    const id = Number(claims.sub);
    if (!Number.isInteger(id) || typeof claims.role !== "string") {
      throw new HttpError(401, INVALID_TOKEN);
    }

    req.user = { id, role: claims.role };
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, INVALID_TOKEN));
  }
};

export function requirePermission(slug: string): RequestHandler {
  return async (req, _res, next) => {
    if (!req.user) {
      next(new HttpError(401, INVALID_TOKEN));
      return;
    }

    try {
      const granted = await authorizationService.hasPermission(req.user.role, slug);
      if (granted) next();
      else next(new HttpError(403, "Insufficient permissions"));
    } catch (err) {
      next(err);
    }
  };
}
