import type {
  PasswordHasher,
  TokenIssuer,
} from "../../shared/application/infrastructure-ports";

export interface AuthUserRow {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: string;
  password_hash: string | null;
}

export interface CurrentUserRow {
  id: number;
  username: string | null;
  name: string;
  email: string;
  role_slug: string;
  role_name: string;
  role_description: string;
}

export interface AuthRepository {
  findByIdentifier(identifier: string): Promise<AuthUserRow | null>;
  getCurrentUser(userId: number): Promise<CurrentUserRow | null>;
  listPermissions(roleSlug: string): Promise<string[]>;
  findUserByEmail(email: string): Promise<{ id: number } | null>;
  guestRoleExists(): Promise<boolean>;
  createGuest(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<{ id: number; name: string; email: string; role: string }>;
  hasPermission(roleSlug: string, permissionSlug: string): Promise<boolean>;
}

export type AuthDependencies = {
  repository: AuthRepository;
  passwordHasher: PasswordHasher;
  tokenIssuer: TokenIssuer;
};
