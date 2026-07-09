import { describe, expect, it } from "vitest";
import { mockProvider } from "../src/ai/providers/mock.provider";

describe("mockProvider (heuristic, zero-config demo provider)", () => {
  it("does not fabricate a data_source when no column gives any real signal", async () => {
    const [record] = await mockProvider.extractBatch([{ name: "Jane", email: "jane@example.com" }], 0);
    // Regression: an earlier version used String.prototype.includes("") to test
    // for a match, which is always true in JS and silently defaulted every
    // unmatched row to the first data source value.
    expect(record!.data_source).toBe("");
  });

  it("leaves the mobile number untouched when an explicit country_code column is already present", async () => {
    const [record] = await mockProvider.extractBatch(
      [{ name: "John", country_code: "+91", mobile_without_country_code: "9876543210" }],
      0
    );
    // Regression: an earlier version applied a country-code-stripping regex
    // unconditionally and chopped the leading digits off an already-clean
    // 10-digit number.
    expect(record!.mobile_without_country_code).toBe("9876543210");
    expect(record!.country_code).toBe("+91");
  });

  it("splits an embedded country code only on unambiguous signals (12 digits starting with 91)", async () => {
    const [record] = await mockProvider.extractBatch([{ name: "Amit", phone: "918123456780" }], 0);
    expect(record!.country_code).toBe("+91");
    expect(record!.mobile_without_country_code).toBe("8123456780");
  });

  it("leaves a bare 10-digit number alone rather than guessing at a split", async () => {
    const [record] = await mockProvider.extractBatch([{ name: "Suresh", phone: "9812345670" }], 0);
    expect(record!.country_code).toBe("");
    expect(record!.mobile_without_country_code).toBe("9812345670");
  });

  it("consolidates a second email/phone into crm_note instead of dropping it", async () => {
    const [record] = await mockProvider.extractBatch(
      [{ name: "Meera", email: "meera@example.com, meera.alt@example.com", phone: "9900112233" }],
      0
    );
    expect(record!.email).toBe("meera@example.com");
    expect(record!.crm_note).toContain("meera.alt@example.com");
  });
});
