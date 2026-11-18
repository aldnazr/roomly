import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { LibsqlPermissionRepository } from "./infrastructure/permission-repository";
import { PermissionService } from "./application/use-cases";

const service = new PermissionService(new LibsqlPermissionRepository());

export const permissionsRouter = Router();

permissionsRouter.use(requireAuth);

permissionsRouter.get("/", async (_req, res) => {
  const data = await service.listPermissions();
  res.status(200).json({ data });
});
