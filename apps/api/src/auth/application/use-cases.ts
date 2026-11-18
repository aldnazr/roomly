import type { LoginInput, RegisterInput } from "../schema";
import type { AuthRepository, AuthUserRow } from "./ports";
import type { PasswordHasher, TokenIssuer } from "../../shared/application/infrastructure-ports";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../../shared/domain/errors";

const TOKEN_TTL_SECONDS = 3600;
const INVALID_CREDENTIALS = "Invalid email or password";

export type MeDto = {
  id: number;
  username: string | null;
  name: string;
  email: string;
  role: {
    slug: string;
    name: string;
    description: string;
  };
  permissions: string[];
};

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async login(input: LoginInput): Promise<{
    data: {
      access_token: string;
      expires_in: number;
      user: {
        id: number;
        name: string;
        username: string | null;
        email: string;
        role: string;
      };
    };
  }> {
    const password = input.password;
    const identifier = ("email" in input ? input.email : input.username) ?? "";

    const user = await this.repository.findByIdentifier(identifier);

    if (!user || !user.password_hash) {
      await this.passwordHasher.compare(password, await this.passwordHasher.hash("timing-equalizer"));
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const valid = await this.passwordHasher.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedError(INVALID_CREDENTIALS);

    const accessToken = await this.tokenIssuer.sign({ sub: String(user.id), role: user.role });

    return {
      data: {
        access_token: accessToken,
        expires_in: TOKEN_TTL_SECONDS,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async getMe(userId: number): Promise<MeDto> {
    const user = await this.repository.getCurrentUser(userId);
    if (!user) throw new UnauthorizedError("Invalid or expired access token");

    const permissions = await this.repository.listPermissions(user.role_slug);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: {
        slug: user.role_slug,
        name: user.role_name,
        description: user.role_description,
      },
      permissions,
    };
  }

  async registerGuest(input: RegisterInput) {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) throw new ConflictError("Email is already in use");

    if (!(await this.repository.guestRoleExists())) {
      throw new ValidationError("Guest role is not configured");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const result = await this.repository.createGuest({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return {
      data: {
        user: {
          id: result.id,
          username: null,
          name: result.name,
          email: result.email,
          role: result.role,
        },
      },
    };
  }
}
