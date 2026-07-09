import type { NextFunction, Request, Response } from "express";
import { parseCsvBuffer } from "../services/csv.service";
import { extractCrmRecords } from "../services/extraction.service";
import { getAiProvider } from "../ai/providerFactory";
import { createSseWriter } from "../utils/sse";
import { config } from "../config";

/**
 * POST /api/import
 *
 * Streams progress via Server-Sent Events by default (what the frontend
 * uses, for the live progress bar) — append ?stream=false for a single
 * plain JSON response instead (handy for curl/Postman/tests, or any future
 * consumer that doesn't want a streaming connection).
 *
 * Either way, this endpoint does its own CSV parsing server-side rather
 * than trusting whatever the browser already parsed for the preview step —
 * never trust client-side parsing for the data that actually gets imported.
 */
export async function importCsv(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    res.status(400).json({ error: { message: 'No file uploaded. Attach a CSV as "file".', code: "NO_FILE" } });
    return;
  }

  let rows;
  try {
    rows = parseCsvBuffer(req.file.buffer);
  } catch (err) {
    next(err);
    return;
  }

  const provider = getAiProvider();
  const streaming = req.query.stream !== "false";

  if (!streaming) {
    try {
      const result = await extractCrmRecords(rows, provider);
      res.status(200).json({ provider: provider.name, ...result });
    } catch (err) {
      next(err);
    }
    return;
  }

  const sse = createSseWriter(res);
  try {
    const result = await extractCrmRecords(rows, provider, (event) => {
      if (event.type === "progress") sse.send("progress", event);
      if (event.type === "batch_error") sse.send("batch_error", event);
    });
    sse.send("done", { provider: provider.name, ...result });
  } catch (err) {
    sse.send("error", { message: err instanceof Error ? err.message : "Unknown error during import." });
  } finally {
    sse.end();
  }
}

export function health(_req: Request, res: Response) {
  res.status(200).json({ status: "ok", provider: config.AI_PROVIDER, time: new Date().toISOString() });
}
