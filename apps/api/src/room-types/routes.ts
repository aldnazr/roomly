import { Router } from "express";
import { requireAuth, requirePermission } from "../auth/middleware";
import {
  parseCreateRoomTypeBody,
  parseQueryRoomType,
  parseUpdateRoomTypeBody,
} from "./schema";
import { parseRoomTypeId } from "./params";
import {
  createRoomType,
  deleteRoomType,
  getRoomType,
  listRoomTypes,
  updateRoomType,
} from "./service";

export const roomTypesRouter = Router();

roomTypesRouter.use(requireAuth);

roomTypesRouter.get("/", requirePermission("rooms.browse"), async (req, res, next) => {
  try {
    const query = parseQueryRoomType(req.query);
    res.status(200).json({ data: await listRoomTypes(query) });
  } catch (err) {
    next(err);
  }
});

roomTypesRouter.get("/:id", requirePermission("rooms.browse"), async (req, res) => {
  const id = parseRoomTypeId(req.params.id);
  res.status(200).json({ data: await getRoomType(id) });
});

roomTypesRouter.post("/", requirePermission("room_types.manage"), async (req, res, next) => {
  try {
    const input = parseCreateRoomTypeBody(req.body);
    const roomType = await createRoomType(input);
    res.status(201).json({ data: roomType });
  } catch (err) {
    next(err);
  }
});

roomTypesRouter.patch("/:id", requirePermission("room_types.manage"), async (req, res, next) => {
  try {
    const id = parseRoomTypeId(req.params.id);
    const input = parseUpdateRoomTypeBody(req.body);
    const roomType = await updateRoomType(id, input);
    res.status(200).json({ data: roomType });
  } catch (err) {
    next(err);
  }
});

roomTypesRouter.delete("/:id", requirePermission("room_types.manage"), async (req, res) => {
  const id = parseRoomTypeId(req.params.id);
  res.status(200).json({ data: await deleteRoomType(id) });
});
