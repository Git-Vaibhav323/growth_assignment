import { describe, expect, it } from "vitest";
import { recordsToCsv } from "../download";
import { CrmRecord } from "../types";

function makeRecord(overrides: Partial<CrmRecord> = {}): CrmRecord {
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
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    crm_note: "",
    data_source: "",
    possession_time: "",
    description: "",
    ...overrides,
  };
}

describe("recordsToCsv", () => {
  it("returns an empty string for no records", () => {
    expect(recordsToCsv([])).toBe("");
  });

  it("writes a header row followed by one row per record", () => {
    const csv = recordsToCsv([makeRecord({ name: "Jane", email: "jane@example.com" })]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(Object.keys(makeRecord()).join(","));
    expect(lines[1]).toContain("Jane");
    expect(lines[1]).toContain("jane@example.com");
  });

  it("quotes values containing commas", () => {
    const csv = recordsToCsv([makeRecord({ crm_note: "Interested; budget 50L, prefers 2BHK" })]);
    expect(csv).toContain('"Interested; budget 50L, prefers 2BHK"');
  });

  it("escapes embedded quotes by doubling them", () => {
    const csv = recordsToCsv([makeRecord({ description: 'Client said "call after 6pm"' })]);
    expect(csv).toContain('"Client said ""call after 6pm"""');
  });
});
