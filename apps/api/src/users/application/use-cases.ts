import type { CreateUserInput, UpdateUserInput } from "../schema";
import type { UserRepository } from "./ports";
import type { PasswordHasher } from "../../shared/application/infrastructure-ports";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../shared/domain/errors";
import type { UserRecord } from "./ports";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async listUsers(): Promise<UserRecord[]> {
    return this.userRepository.list();
  }

  async getUser(id: number): Promise<UserRecord> {
    const user = await this.userRepository.getById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    if (!(await this.userRepository.roleExists(input.role))) {
      throw new ValidationError(`Role '${input.role}' does not exist`);
    }

    const emailConflict = await this.userRepository.findByEmail(input.email);
    if (emailConflict) throw new ConflictError("Email is already in use");

    if (input.username) {
      const usernameConflict = await this.userRepository.findByUsername(input.username);
      if (usernameConflict) throw new ConflictError("Username is already in use");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    return this.userRepository.create({
      username: input.username,
      email: input.email,
      role: input.role,
      passwordHash,
    });
  }

  async updateUser(id: number, input: UpdateUserInput): Promise<UserRecord> {
    await this.getUser(id);

    if (input.role && !(await this.userRepository.roleExists(input.role))) {
      throw new ValidationError(`Role '${input.role}' does not exist`);
    }

    if (input.email) {
      const conflict = await this.userRepository.findByEmail(input.email, id);
      if (conflict) throw new ConflictError("Email is already in use");
    }

    if (input.username) {
      const conflict = await this.userRepository.findByUsername(input.username, id);
      if (conflict) throw new ConflictError("Username is already in use");
    }

    const passwordHash =
      input.password !== undefined ? await this.passwordHasher.hash(input.password) : undefined;

    return this.userRepository.update(id, {
      username: input.username,
      email: input.email,
      role: input.role,
      passwordHash,
    });
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    await this.getUser(id);
    await this.userRepository.delete(id);
    return { message: "User deleted successfully" };
  }
}
