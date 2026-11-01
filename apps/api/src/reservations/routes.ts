import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth, requirePermission } from "../auth/middleware";
import { HttpError } from "../errors";
import {
  cancelReservationSchema,
  createCheckoutReservationSchema,
} from "./schema";
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  createCheckoutReservation,
  getActiveReservation,
  getDailyOperations,
  getReservation,
  listReservations,
} from "./service";

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

const dailyOperationsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateParam = req.query.date;
    const date =
      typeof dateParam === "string" && dateParam.length > 0
        ? dateParam
        : new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
      throw new HttpError(400, "Invalid date");
    }
    res.status(200).json({ data: await getDailyOperations(date) });
  } catch (error) {
    next(error);
  }
};
reservationsRouter.get(
  "/daily-operations",
  requirePermission("bookings.view_all"),
  dailyOperationsHandler,
);

reservationsRouter.get("/active", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ data: await getActiveReservation(req.user!) });
  } catch (error) {
    next(error);
  }
});

const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, "Not found"));
};
reservationsRouter.get("/me", notFoundHandler);
reservationsRouter.get("/mine", notFoundHandler);
reservationsRouter.get("/history", notFoundHandler);

reservationsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseReservationId(req.params.id);
    res.status(200).json({ data: await getReservation(id, req.user!) });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post("/:id/cancel", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseReservationId(req.params.id);
    const input = cancelReservationSchema.parse(req.body ?? {});
    const data = await cancelReservation(id, req.user!, input.reason);
    res.status(200).json({ message: "Reservasi berhasil dibatalkan", data });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post(
  "/:id/check-in",
  requirePermission("bookings.check_in"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseReservationId(req.params.id);
      res.status(200).json({ data: await checkInReservation(id, req.user!) });
    } catch (error) {
      next(error);
    }
  },
);

reservationsRouter.post(
  "/:id/check-out",
  requirePermission("bookings.check_out"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseReservationId(req.params.id);
      res.status(200).json({ data: await checkOutReservation(id, req.user!) });
    } catch (error) {
      next(error);
    }
  },
);

reservationsRouter.post("/checkout", requirePermission("bookings.create"), async (req, res, next) => {
  try {
    const input = createCheckoutReservationSchema.parse(req.body);
    const reservation = await createCheckoutReservation(input, req.user!);
    res.status(201).json({ data: reservation });
  } catch (error) {
    next(error);
  }
});