import { CrmRecord } from "./types";

function triggerDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/** Pure CSV-building logic, kept separate from the DOM side effects below so it's unit-testable without a browser. */
export function recordsToCsv(records: CrmRecord[]): string {
  if (records.length === 0) return "";
  const headers = Object.keys(records[0]!) as (keyof CrmRecord)[];
  const lines = [
    headers.join(","),
    ...records.map((record) => headers.map((h) => escapeCsvValue(String(record[h] ?? ""))).join(",")),
  ];
  return lines.join("\n");
}

export function downloadAsJson(records: CrmRecord[], fileName = "groweasy-crm-import.json") {
  triggerDownload(JSON.stringify(records, null, 2), fileName, "application/json");
}

export function downloadAsCsv(records: CrmRecord[], fileName = "groweasy-crm-import.csv") {
  const csv = recordsToCsv(records);
  if (!csv) return;
  triggerDownload(csv, fileName, "text/csv");
}
