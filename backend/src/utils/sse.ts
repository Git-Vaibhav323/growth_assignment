import type { Response } from "express";

/** Thin wrapper around Server-Sent Events framing so callers just pass an event name + JSON-serializable data. */
export function createSseWriter(res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable proxy buffering (nginx/Render) so events flush immediately
  });
  // Some proxies hold back the first bytes until a minimum size is seen.
  res.write(":ok\n\n");

  return {
    send(event: string, data: unknown) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    end() {
      res.end();
    },
  };
}
