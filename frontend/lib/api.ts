import { ExtractionResult, ImportProgress } from "./types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ImportEvent =
  | { type: "progress"; progress: ImportProgress }
  | { type: "batch_error"; batchIndex: number; message: string }
  | { type: "done"; result: ExtractionResult }
  | { type: "error"; message: string };

/**
 * Uploads a CSV and streams progress back over Server-Sent Events.
 *
 * This deliberately uses `fetch` + a manual reader over `response.body`
 * rather than the browser's `EventSource` API: `EventSource` can only issue
 * GET requests, so it can't carry the multipart file upload this endpoint
 * needs. Reading the stream by hand works the same way and is broadly
 * supported.
 */
export async function importCsvFile(file: File, onEvent: (event: ImportEvent) => void): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/import`, { method: "POST", body: formData });
  } catch {
    onEvent({
      type: "error",
      message: `Couldn't reach the import API at ${API_BASE_URL}. Is the backend running?`,
    });
    return;
  }

  if (!response.ok || !response.body) {
    let message = `Import failed (status ${response.status}).`;
    try {
      const data = await response.json();
      message = data?.error?.message ?? message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    onEvent({ type: "error", message });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const parsed = parseSseEvent(rawEvent);
      if (parsed) dispatch(parsed, onEvent);
    }
  }
}

export function parseSseEvent(raw: string): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

function dispatch({ event, data }: { event: string; data: string }, onEvent: (event: ImportEvent) => void) {
  try {
    const parsed = JSON.parse(data);
    switch (event) {
      case "progress":
        onEvent({ type: "progress", progress: parsed });
        break;
      case "batch_error":
        onEvent({ type: "batch_error", batchIndex: parsed.batchIndex, message: parsed.message });
        break;
      case "done":
        onEvent({ type: "done", result: parsed });
        break;
      case "error":
        onEvent({ type: "error", message: parsed.message });
        break;
      default:
      // ignore the leading ":ok" keep-alive comment and unknown events
    }
  } catch {
    // A fragment that wasn't valid JSON on its own — safe to ignore, since
    // the buffering above only hands us text between "\n\n" separators.
  }
}
