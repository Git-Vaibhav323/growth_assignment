import type { Request, Response } from "express";

// Deliberately registered with no path (not "*"), which is the
// version-agnostic way to write a catch-all in both Express 4 and 5's
// path-to-regexp implementations.
export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: { message: `No route: ${req.method} ${req.path}`, code: "NOT_FOUND" } });
}
