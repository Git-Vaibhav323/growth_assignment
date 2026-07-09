import Papa from "papaparse";
import { RawRow } from "../ai/types";

export class CsvParseError extends Error {}

/**
 * Parses a raw CSV buffer with no assumptions about column names. Blank rows
 * (every cell empty) are dropped here — they're not "records" at all, so
 * they should neither be sent to the AI nor counted in totals.
 */
export function parseCsvBuffer(buffer: Buffer): RawRow[] {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, ""); // strip BOM (common in Excel exports)

  if (!text.trim()) {
    throw new CsvParseError("The uploaded file is empty.");
  }

  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
    throw new CsvParseError("No header row could be detected in this file.");
  }

  const fatalErrors = parsed.errors.filter((e) => e.type !== "FieldMismatch");
  if (fatalErrors.length > 0 && parsed.data.length === 0) {
    throw new CsvParseError(`Could not parse this CSV: ${fatalErrors[0]!.message}`);
  }

  const nonBlankRows = parsed.data.filter((row) =>
    Object.values(row).some((v) => typeof v === "string" && v.trim() !== "")
  );

  if (nonBlankRows.length === 0) {
    throw new CsvParseError("This CSV has a header row but no data rows.");
  }

  return nonBlankRows;
}
