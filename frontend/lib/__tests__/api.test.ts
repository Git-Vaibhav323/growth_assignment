import { describe, expect, it } from "vitest";
import { parseSseEvent } from "../api";

describe("parseSseEvent", () => {
  it("extracts the event name and JSON data from a well-formed SSE frame", () => {
    const raw = 'event: progress\ndata: {"batchesCompleted":1,"batchesTotal":4}';
    expect(parseSseEvent(raw)).toEqual({
      event: "progress",
      data: '{"batchesCompleted":1,"batchesTotal":4}',
    });
  });

  it("defaults to event 'message' when no event: line is present", () => {
    expect(parseSseEvent('data: {"a":1}')).toEqual({ event: "message", data: '{"a":1}' });
  });

  it("returns null for a comment-only frame (e.g. the ':ok' keep-alive ping)", () => {
    expect(parseSseEvent(":ok")).toBeNull();
  });

  it("joins multiple data: lines with a newline, per the SSE spec", () => {
    const raw = "event: done\ndata: line one\ndata: line two";
    expect(parseSseEvent(raw)?.data).toBe("line one\nline two");
  });
});
