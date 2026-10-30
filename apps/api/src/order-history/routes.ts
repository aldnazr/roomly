import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "../auth/middleware";
import { HttpError } from "../errors";
import { parseAdminOrderHistoryQuery } from "./schema";
import { listAdminOrderHistory } from "./service";

export const adminOrderHistoryRouter = Router();

adminOrderHistoryRouter.use(requireAuth);

adminOrderHistoryRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      throw new HttpError(403, "Insufficient permissions");
    }
    const filters = parseAdminOrderHistoryQuery(req.query);
    const result = await listAdminOrderHistory(req.user!, filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
