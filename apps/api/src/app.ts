import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { authRouter } from "./auth/routes";
import { rolesRouter } from "./roles/routes";
import { permissionsRouter } from "./permissions/routes";
import { usersRouter } from "./users/routes";
import { roomTypesRouter } from "./room-types/routes";
import { publicRoomTypesRouter } from "./room-types/public-routes";
import { availabilityRouter } from "./availability/routes";
import { paymentsRouter } from "./payments/routes";
import { reservationsRouter } from "./reservations/routes";
import { adminOrderHistoryRouter } from "./order-history/routes";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } });
  } else if (err instanceof ZodError) {
    res.status(400).json({ error: { message: err.issues[0]?.message ?? "Invalid request body" } });
  } else if (err instanceof SyntaxError || err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Malformed JSON body" } });
  } else if (err?.type === "entity.too.large") {
    res.status(413).json({ error: { message: "Request body too large" } });
  } else {
    console.error(err);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

export function createApp() {
  const app = express();

  // Vercel fronts the API with one proxy hop, so the client IP is the last
  // entry of X-Forwarded-For. Rate limiting keys off req.ip and needs this.
  app.set("trust proxy", 1);

  app.use(
    cors({
      // Wildcard `*` is illegal with credentialed requests; echo an explicit origin.
      // ponytail: single origin only, add allow-list when a second frontend exists.
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use("/api/payments/webhook/mock", express.raw({ type: "*/*" }));
  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/roles", rolesRouter);
  app.use("/api/permissions", permissionsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/public/room-types", publicRoomTypesRouter);
  app.use("/api/room-types", roomTypesRouter);
  app.use("/api/availability", availabilityRouter);
  app.use("/api/reservations", reservationsRouter);
app.use("/api/admin/orders", adminOrderHistoryRouter);
app.use("/api/admin/order-history", adminOrderHistoryRouter);
app.use("/api/orders", adminOrderHistoryRouter);
app.use("/api/orders/history", adminOrderHistoryRouter);
app.use("/api/reservations/admin/history", adminOrderHistoryRouter);
app.use("/api/reservations/history/admin", adminOrderHistoryRouter);
  app.use("/api/payments", paymentsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { message: "Not found" } });
  });
  app.use(errorHandler);

  return app;
}

