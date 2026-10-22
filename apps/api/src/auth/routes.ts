import { Router } from "express";
import { requireAuth } from "./middleware";
import { getMe, login, registerGuest } from "./service";
import { parseRegisterBody } from "./schema";
import { rateLimit } from "../middleware/rate-limit";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  res.status(200).json(await login(req.body));
});

authRouter.post(
  "/register",
  rateLimit({ limit: 5, windowMs: 60_000 }),
  async (req, res, next) => {
    try {
      const input = parseRegisterBody(req.body);
      res.status(201).json(await registerGuest(input));
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get("/me", requireAuth, async (req, res) => {
  res.status(200).json({ data: await getMe(req.user!.id) });
});

