import { z } from "zod";

export const paymentSchema = z
  .object({
    reservation_id: z.string("ID pemesanan wajib diisi"),
    method: z.enum(["va", "qris"], "Wajib memilih metode pembayaran"),
    bank: z.enum(["bca", "bni", "bri", "mandiri"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "va" && !data.bank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bank"],
        message: "Pilih salah satu bank yang tersedia",
      });
    }
  });

export type PaymentInput = z.infer<typeof paymentSchema>;
