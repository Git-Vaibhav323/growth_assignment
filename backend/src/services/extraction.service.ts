import { config } from "../config";
import { AiProvider, CrmRecord, CrmRecordRaw, RawRow } from "../ai/types";
import { chunk } from "../utils/batching";
import { asyncPool } from "../utils/asyncPool";
import { shouldSkip, validateAndRepair } from "./validation.service";

export interface SkippedRecord {
  rowIndex: number;
  raw: RawRow;
  reason: string;
}

export interface ExtractionResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

export type ProgressEvent =
  | {
      type: "progress";
      batchesCompleted: number;
      batchesTotal: number;
      rowsProcessed: number;
      rowsTotal: number;
    }
  | { type: "batch_error"; batchIndex: number; message: string };

export type ProgressCallback = (event: ProgressEvent) => void;

interface IndexedRow {
  row: RawRow;
  index: number;
}

export async function extractCrmRecords(
  rows: RawRow[],
  provider: AiProvider,
  onProgress?: ProgressCallback
): Promise<ExtractionResult> {
  const indexedRows: IndexedRow[] = rows.map((row, index) => ({ row, index }));
  const rowsByIndex = new Map(indexedRows.map((r) => [r.index, r.row]));
  const batches = chunk(indexedRows, config.BATCH_SIZE);

  const importedRaw: CrmRecordRaw[] = [];
  const skipped: SkippedRecord[] = [];
  let batchesCompleted = 0;

  const tasks = batches.map((batch, batchIndex) => async () => {
    const batchRows = batch.map((b) => b.row);
    const startIndex = batch[0]!.index;

    try {
      const results = await withRetry(
        () => provider.extractBatch(batchRows, startIndex),
        config.AI_MAX_RETRIES
      );

      const returnedIndexes = new Set(results.map((r) => r.row_index));

      for (const result of results) {
        const repaired = validateAndRepair(result);
        if (shouldSkip(repaired)) {
          skipped.push({
            rowIndex: result.row_index,
            raw: rowsByIndex.get(result.row_index) ?? {},
            reason: "Missing both an email address and a mobile number",
          });
        } else {
          importedRaw.push(repaired);
        }
      }

      // Defensive: if the model dropped a row from its response entirely
      // (shouldn't happen with a strict schema, but providers can be swapped),
      // it's tracked as skipped rather than silently vanishing.
      for (const b of batch) {
        if (!returnedIndexes.has(b.index)) {
          skipped.push({
            rowIndex: b.index,
            raw: b.row,
            reason: "AI response did not include this row",
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown AI extraction error";
      onProgress?.({ type: "batch_error", batchIndex, message });
      for (const b of batch) {
        skipped.push({ rowIndex: b.index, raw: b.row, reason: `AI extraction failed: ${message}` });
      }
    } finally {
      batchesCompleted++;
      onProgress?.({
        type: "progress",
        batchesCompleted,
        batchesTotal: batches.length,
        rowsProcessed: Math.min(batchesCompleted * config.BATCH_SIZE, indexedRows.length),
        rowsTotal: indexedRows.length,
      });
    }
  });

  await asyncPool(config.AI_CONCURRENCY, tasks);

  importedRaw.sort((a, b) => a.row_index - b.row_index);
  skipped.sort((a, b) => a.rowIndex - b.rowIndex);

  const imported: CrmRecord[] = importedRaw.map(({ row_index, ...rest }) => rest);

  return {
    imported,
    skipped,
    totalRows: indexedRows.length,
    totalImported: imported.length,
    totalSkipped: skipped.length,
  };
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 500 * 3 ** attempt; // 500ms, 1.5s, 4.5s, ...
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
