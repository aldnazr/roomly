import { Router } from "express";
import { rateLimit } from "../middleware/rate-limit";
import { parseRoomTypeId } from "./params";
import { parseQueryRoomType } from "./schema";
import { getRoomType, listRoomTypes } from "./service";

// Public catalog for anonymous visitors. Same DTO as the staff route, but
// without a token and without rooms.browse, so a guest page can render it.
export const publicRoomTypesRouter = Router();

publicRoomTypesRouter.use(
  rateLimit({
    limit: 120,
    windowMs: 60_000,
    message: "Too many requests. Please wait a moment before trying again.",
  }),
);

publicRoomTypesRouter.get("/", async (req, res, next) => {
  try {
    const query = parseQueryRoomType(req.query);
    res.status(200).json({ data: await listRoomTypes(query) });
  } catch (err) {
    next(err);
  }
});

publicRoomTypesRouter.get("/:id", async (req, res) => {
  const id = parseRoomTypeId(req.params.id);
  res.status(200).json({ data: await getRoomType(id) });
});
