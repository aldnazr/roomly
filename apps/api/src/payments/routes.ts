import crypto from "node:crypto";
import express, { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware";
import { queryOne } from "../db";
import { HttpError } from "../errors";
import { getPaymentProvider } from "./provider";
import { createPayment, getPayment, transitionPayment } from "./service";
import type { DbPaymentRow } from "./types";

export const paymentsRouter = Router();

const createPaymentSchema = z
  .object({
    reservation_id: z.string().min(1, "reservation_id is required"),
    method: z.enum(["va", "qris"]),
    bank: z.enum(["bca", "bni", "bri", "mandiri"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "va" && !data.bank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bank"],
        message: "bank is required for virtual account payments",
      });
    }
    if (data.method === "qris" && data.bank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bank"],
        message: "bank is only valid for virtual account payments",
      });
    }
  });

// POST /api/payments
paymentsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = createPaymentSchema.parse(req.body);
    const result = await createPayment(
      { reservationId: parsed.reservation_id, method: parsed.method, bank: parsed.bank },
      req.user!,
    );
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/:id
paymentsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await getPayment(String(req.params.id), req.user!);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook/mock
paymentsRouter.post(
  "/webhook/mock",
  express.raw({ type: "*/*" }),
  async (req, res, next) => {
    try {
      const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body || "");
      const signature =
        (req.headers["x-signature"] as string) ||
        (req.headers["signature"] as string) ||
        (req.headers["x-mock-signature"] as string) ||
        "";

      const provider = getPaymentProvider();
      let parsed: { providerRef: string; status: "paid" | "failed" | "expired" };

      try {
        parsed = provider.verifyAndParseWebhook(rawBody, signature);
      } catch (err: any) {
        if (err.message === "Invalid signature") {
          throw new HttpError(401, "Invalid signature");
        }
        throw new HttpError(400, err.message || "Invalid payload");
      }

      const payment = await queryOne<DbPaymentRow>("SELECT * FROM payments WHERE provider_ref = ?", [
        parsed.providerRef,
      ]);

      if (!payment) {
        throw new HttpError(404, "Payment not found");
      }

      await transitionPayment(payment.id, parsed.status);
      res.status(200).json({ message: "OK" });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/payments/:id/simulate
paymentsRouter.post("/:id/simulate", requireAuth, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new HttpError(404, "Not found");
    }

    const schema = z.object({
      result: z.enum(["paid", "failed"]),
    });
    const parsed = schema.parse(req.body);

    const payment = await queryOne<DbPaymentRow>("SELECT * FROM payments WHERE id = ?", [String(req.params.id)]);
    if (!payment) {
      throw new HttpError(404, "Payment not found");
    }

    await getPayment(String(req.params.id), req.user!);

    const payload = JSON.stringify({
      provider_ref: payment.provider_ref,
      status: parsed.result,
    });

    const secret = process.env.MOCK_WEBHOOK_SECRET || "change-me";
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    // Invoke same transition logic
    await transitionPayment(payment.id, parsed.result);
    res.status(200).json({ message: "OK" });
  } catch (err) {
    next(err);
  }
});
