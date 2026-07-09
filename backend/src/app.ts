import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { importRouter } from "./routes/import.routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  // FRONTEND_URL may be a comma-separated list for local dev
  // (Next.js falls back to port 3001 when 3000 is taken).
  const allowedOrigins = config.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      methods: ["GET", "POST"],
    })
  );
  if (config.NODE_ENV !== "test") {
    app.use(morgan(config.NODE_ENV === "development" ? "dev" : "combined"));
  }

  // Generous but real: caps abuse without getting in the way of normal use
  // (a handful of imports while testing/demoing).
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false });
  app.use("/api", limiter);

  app.use("/api", importRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
