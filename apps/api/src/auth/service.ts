import { BcryptPasswordHasher } from "../infrastructure/password-hasher";
import { JoseTokenIssuer } from "../infrastructure/token-issuer";
import { LibsqlAuthRepository } from "./infrastructure/auth-repository";
import { AuthService } from "./application/use-cases";
import { parseLoginBody, parseRegisterBody } from "./schema";
import type { RegisterInput } from "./schema";

const service = new AuthService(
  new LibsqlAuthRepository(),
  new BcryptPasswordHasher(),
  new JoseTokenIssuer(),
);

export type { MeDto } from "./application/use-cases";

export async function login(body: unknown) {
  const parsed = parseLoginBody(body);
  return service.login(parsed);
}

export async function getMe(userId: number) {
  return service.getMe(userId);
}

export async function registerGuest(input: RegisterInput) {
  return service.registerGuest(input);
}
