import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, requirePermission } from "../auth/middleware";
import { HttpError } from "../errors";
import { createCheckoutReservationSchema } from "./schema";
import { createCheckoutReservation, getReservation, listReservations } from "./service";

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth);

function parseReservationId(param: string | string[] | undefined): number {
  const value = Array.isArray(param) ? param[0] : param;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid reservation ID");
  }
  return id;
}

const listHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ data: await listReservations(req.user!) });
  } catch (error) {
    next(error);
  }
};

reservationsRouter.get("/", listHandler);
reservationsRouter.get("/me", listHandler);
reservationsRouter.get("/mine", listHandler);
reservationsRouter.get("/history", listHandler);

reservationsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseReservationId(req.params.id);
    res.status(200).json({ data: await getReservation(id, req.user!) });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post("/checkout", requirePermission("bookings.create"), async (req, res, next) => {
  try {
    const input = createCheckoutReservationSchema.parse(req.body);
    const reservation = await createCheckoutReservation(input, req.user!);
    res.status(201).json({ data: reservation });
  } catch (error) {
    next(error);
  }
});