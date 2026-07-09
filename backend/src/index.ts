import { config } from "./config";
import { createApp } from "./app";
import { logger } from "./utils/logger";

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(`GrowEasy CSV importer API listening on port ${config.PORT}`, {
    provider: config.AI_PROVIDER,
    env: config.NODE_ENV,
  });
});

function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  server.close(() => process.exit(0));
  // Force-exit if connections don't close in time.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection", { reason: String(reason) }));
