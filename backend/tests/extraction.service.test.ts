import { describe, expect, it, vi } from "vitest";
import { extractCrmRecords } from "../src/services/extraction.service";
import { AiProvider, CrmRecordRaw, RawRow } from "../src/ai/types";

function blankFields() {
  return {
    created_at: "",
    name: "",
    email: "",
    country_code: "",
    mobile_without_country_code: "",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "GOOD_LEAD_FOLLOW_UP" as const,
    crm_note: "",
    data_source: "" as const,
    possession_time: "",
    description: "",
  };
}

/** Echoes each row back with a deterministic email so results are easy to assert on. */
function makeEchoProvider(): AiProvider {
  return {
    name: "fake",
    async extractBatch(rows: RawRow[], startIndex: number): Promise<CrmRecordRaw[]> {
      return rows.map((_row, i) => ({
        row_index: startIndex + i,
        ...blankFields(),
        email: `row${startIndex + i}@example.com`,
      }));
    },
  };
}

describe("extractCrmRecords", () => {
  it("imports rows that have contact info and skips rows that don't", async () => {
    const rows: RawRow[] = [{ name: "A" }, { name: "B" }];
    const provider: AiProvider = {
      name: "fake",
      async extractBatch(batchRows, startIndex) {
        return batchRows.map((_r, i) => ({
          row_index: startIndex + i,
          ...blankFields(),
          email: i === 0 ? "has-email@example.com" : "", // second row gets neither email nor phone
        }));
      },
    };

    const result = await extractCrmRecords(rows, provider);
    expect(result.totalRows).toBe(2);
    expect(result.totalImported).toBe(1);
    expect(result.totalSkipped).toBe(1);
    expect(result.skipped[0]?.reason).toMatch(/email.*mobile/i);
  });

  it("processes more rows than one batch across multiple batches, preserving order", async () => {
    const rows: RawRow[] = Array.from({ length: 45 }, (_, i) => ({ name: `Lead ${i}` }));
    const result = await extractCrmRecords(rows, makeEchoProvider());
    expect(result.totalImported).toBe(45);
    expect(result.imported.map((r) => r.email)).toEqual(
      Array.from({ length: 45 }, (_, i) => `row${i}@example.com`)
    );
  });

  it("reports progress events as batches complete", async () => {
    const rows: RawRow[] = Array.from({ length: 25 }, (_, i) => ({ name: `Lead ${i}` }));
    const onProgress = vi.fn();
    await extractCrmRecords(rows, makeEchoProvider(), onProgress);
    const progressEvents = onProgress.mock.calls.map((c) => c[0]).filter((e) => e.type === "progress");
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents.at(-1)).toMatchObject({ batchesCompleted: progressEvents.length, rowsTotal: 25 });
  });

  it("keeps other batches succeeding when one batch's AI call fails permanently, and reports it as skipped", { timeout: 15000 }, async () => {
    const rows: RawRow[] = Array.from({ length: 22 }, (_, i) => ({ name: `Lead ${i}` }));
    let call = 0;
    const flakyProvider: AiProvider = {
      name: "flaky",
      async extractBatch(batchRows, startIndex) {
        call++;
        if (startIndex === 20) throw new Error("simulated provider outage");
        return batchRows.map((_r, i) => ({ row_index: startIndex + i, ...blankFields(), email: "ok@example.com" }));
      },
    };

    const result = await extractCrmRecords(rows, flakyProvider);
    expect(result.totalImported).toBe(20);
    expect(result.totalSkipped).toBe(2);
    expect(result.skipped.every((s) => s.reason.includes("AI extraction failed"))).toBe(true);
    expect(call).toBeGreaterThan(1); // confirms the failing batch was retried, not just tried once
  });
});
