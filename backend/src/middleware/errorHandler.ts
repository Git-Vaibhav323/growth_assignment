import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { CsvParseError } from "../services/csv.service";
import { logger } from "../utils/logger";

interface ApiError {
  message: string;
  code: string;
}

function toApiError(err: unknown): { status: number; body: ApiError } {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return { status: 413, body: { message: "File is too large.", code: "FILE_TOO_LARGE" } };
    }
    return { status: 400, body: { message: err.message, code: err.code } };
  }
  if (err instanceof CsvParseError) {
    return { status: 400, body: { message: err.message, code: "CSV_PARSE_ERROR" } };
  }
  if (err instanceof Error && err.message === "Only .csv files are supported.") {
    return { status: 400, body: { message: err.message, code: "INVALID_FILE_TYPE" } };
  }
  return {
    status: 500,
    body: { message: "Something went wrong while processing your request.", code: "INTERNAL_ERROR" },
  };
}

// Express recognizes an error-handling middleware by its 4-argument arity —
// `next` must stay in the signature even though it's unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const { status, body } = toApiError(err);
  if (status >= 500) {
    logger.error("Unhandled error", { message: err instanceof Error ? err.message : String(err), path: req.path });
  }
  if (res.headersSent) {
    // A streaming (SSE) response had already started; nothing more to send.
    res.end();
    return;
  }
  res.status(status).json({ error: body });
}
