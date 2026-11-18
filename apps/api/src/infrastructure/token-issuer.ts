import { SignJWT, jwtVerify } from "jose";
import { requireJwtSecret } from "../config";
import type {
  TokenClaims,
  TokenIssuer,
} from "../shared/application/infrastructure-ports";

const TOKEN_TTL_SECONDS = 3600;

export class JoseTokenIssuer implements TokenIssuer {
  async sign(claims: TokenClaims): Promise<string> {
    const secret = new TextEncoder().encode(requireJwtSecret());
    return new SignJWT({ role: claims.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.sub)
      .setIssuedAt()
      .setIssuer("roomly-api")
      .setAudience("roomly")
      .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
      .sign(secret);
  }

  async verify(token: string): Promise<TokenClaims> {
    const secret = new TextEncoder().encode(requireJwtSecret());
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: "roomly-api",
      audience: "roomly",
    });
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || typeof payload.role !== "string") {
      throw new Error("Invalid token");
    }
    return { sub: String(id), role: payload.role };
  }
}
