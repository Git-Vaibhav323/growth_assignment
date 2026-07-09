import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  fileName: string;
}

/** Client-side-only parsing for the preview step — no AI, no network call. */
export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          reject(new Error("This file doesn't seem to have a header row."));
          return;
        }
        const nonBlank = results.data.filter((row) =>
          Object.values(row).some((v) => typeof v === "string" && v.trim() !== "")
        );
        if (nonBlank.length === 0) {
          reject(new Error("This CSV has a header row but no data rows."));
          return;
        }
        resolve({
          headers: results.meta.fields,
          rows: nonBlank,
          rowCount: nonBlank.length,
          fileName: file.name,
        });
      },
      error: (err) => reject(err),
    });
  });
}
