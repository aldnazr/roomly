import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required").max(100, "Name is too long");

const registerSchema = z.object({
  name: nameSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Invalid email address")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export function parseRegisterBody(body: unknown): RegisterInput {
  return registerSchema.parse(body);
}

const loginSchema = z.union([
  z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Invalid email address")),
    password: z.string().min(1, "Password is required"),
  }),
  z.object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
]);

export type LoginInput = z.infer<typeof loginSchema>;

export function parseLoginBody(body: unknown): LoginInput {
  return loginSchema.parse(body);
}
