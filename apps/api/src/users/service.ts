import { BcryptPasswordHasher } from "../infrastructure/password-hasher";
import { LibsqlUserRepository } from "./infrastructure/user-repository";
import { UserService } from "./application/use-cases";
import type { CreateUserInput, UpdateUserInput } from "./schema";

const service = new UserService(new LibsqlUserRepository(), new BcryptPasswordHasher());

export type UserDto = {
  id: number;
  username: string | null;
  name: string;
  email: string;
  role: string;
};

export async function listUsers() {
  return service.listUsers();
}

export async function getUser(id: number) {
  return service.getUser(id);
}

export async function createUser(input: CreateUserInput) {
  return service.createUser(input);
}

export async function updateUser(id: number, input: UpdateUserInput) {
  return service.updateUser(id, input);
}

export async function deleteUser(id: number) {
  return service.deleteUser(id);
}
