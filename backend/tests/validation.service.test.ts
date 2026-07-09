import { describe, expect, it } from "vitest";
import { normalizeDate, shouldSkip, validateAndRepair } from "../src/services/validation.service";
import { CrmRecordRaw } from "../src/ai/types";

function makeRecord(overrides: Partial<CrmRecordRaw> = {}): CrmRecordRaw {
  return {
    row_index: 0,
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

describe("normalizeDate", () => {
  it("rewrites the GrowEasy sample format (space-separated) to strict ISO", () => {
    expect(normalizeDate("2026-05-13 14:20:48")).toBe("2026-05-13T14:20:48");
  });

  it("leaves an already-ISO date unchanged", () => {
    expect(normalizeDate("2026-05-13T14:20:48")).toBe("2026-05-13T14:20:48");
  });

  it("reads DD/MM/YYYY as day-first (India-based data)", () => {
    expect(normalizeDate("13/05/2026")).toBe("2026-05-13T00:00:00");
  });

  it("returns an empty string for unparseable input rather than guessing", () => {
    expect(normalizeDate("not a date")).toBe("");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeDate("   ")).toBe("");
  });

  it("every normalized non-empty date is new Date()-parseable", () => {
    for (const raw of ["2026-05-13 14:20:48", "13/05/2026", "2026-05-13T14:20:48"]) {
      const normalized = normalizeDate(raw);
      expect(Number.isNaN(new Date(normalized).getTime())).toBe(false);
    }
  });
});

describe("shouldSkip", () => {
  it("skips a record with neither email nor mobile", () => {
    expect(shouldSkip(makeRecord())).toBe(true);
  });

  it("keeps a record with only an email", () => {
    expect(shouldSkip(makeRecord({ email: "a@b.com" }))).toBe(false);
  });

  it("keeps a record with only a mobile number", () => {
    expect(shouldSkip(makeRecord({ mobile_without_country_code: "9876543210" }))).toBe(false);
  });
});

describe("validateAndRepair", () => {
  it("passes through a valid crm_status unchanged", () => {
    expect(validateAndRepair(makeRecord({ crm_status: "SALE_DONE" })).crm_status).toBe("SALE_DONE");
  });

  it("falls back an invalid crm_status to GOOD_LEAD_FOLLOW_UP", () => {
    // @ts-expect-error intentionally testing an invalid enum value from a hypothetical non-strict provider
    const repaired = validateAndRepair(makeRecord({ crm_status: "MAYBE" }));
    expect(repaired.crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
  });

  it("blanks an invalid data_source instead of guessing", () => {
    // @ts-expect-error intentionally testing an invalid enum value
    const repaired = validateAndRepair(makeRecord({ data_source: "some_unknown_project" }));
    expect(repaired.data_source).toBe("");
  });

  it("strips non-digit characters from mobile numbers", () => {
    expect(validateAndRepair(makeRecord({ mobile_without_country_code: "98765 43210" })).mobile_without_country_code).toBe(
      "9876543210"
    );
  });
});
