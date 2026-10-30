import { Router } from "express";
import { requireAuth, requirePermission } from "../auth/middleware";
import { createCheckoutReservationSchema } from "./schema";
import { createCheckoutReservation } from "./service";

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth);

reservationsRouter.post("/checkout", requirePermission("bookings.create"), async (req, res, next) => {
  try {
    const input = createCheckoutReservationSchema.parse(req.body);
    const reservation = await createCheckoutReservation(input, req.user!);
    res.status(201).json({ data: reservation });
  } catch (error) {
    next(error);
  }
});
