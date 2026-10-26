import { email, z } from "zod";

const loginIdentifier = z
  .string()
  .trim()
  .min(1, "Harap masukkan username atau email")
  .refine(
    (v) => {
      const isEmail = z.email().safeParse(v).success;
      const isUsername = /^[a-zA-Z0-9._]{3,}$/.test(v);

      return isEmail || isUsername;
    },
    { message: "Masukkan username atau email yang valid" },
  );

export const loginSchema = z.object({
  identifier: loginIdentifier,
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z.email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  terms: z.boolean().refine((val) => val === true, {
    message: "Anda harus menyetujui syarat & ketentuan",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
