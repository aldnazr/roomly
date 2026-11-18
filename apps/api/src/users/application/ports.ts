export type UserRecord = {
  id: number;
  username: string | null;
  name: string;
  email: string;
  role: string;
};

export interface UserRepository {
  list(): Promise<UserRecord[]>;
  getById(id: number): Promise<UserRecord | null>;
  create(input: {
    username: string;
    email: string;
    role: string;
    passwordHash: string;
  }): Promise<UserRecord>;
  update(
    id: number,
    input: {
      username?: string;
      email?: string;
      role?: string;
      passwordHash?: string;
    },
  ): Promise<UserRecord>;
  delete(id: number): Promise<void>;
  roleExists(roleSlug: string): Promise<boolean>;
  findByEmail(email: string, excludeUserId?: number): Promise<UserRecord | null>;
  findByUsername(username: string, excludeUserId?: number): Promise<UserRecord | null>;
}
