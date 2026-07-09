import { describe, expect, it } from "vitest";
import { CsvParseError, parseCsvBuffer } from "../src/services/csv.service";

describe("parseCsvBuffer", () => {
  it("parses arbitrary column names into row objects", () => {
    const csv = "Full Name,email_id,Contact No.\nJohn Doe,john@example.com,9876543210\n";
    const rows = parseCsvBuffer(Buffer.from(csv));
    expect(rows).toEqual([{ "Full Name": "John Doe", email_id: "john@example.com", "Contact No.": "9876543210" }]);
  });

  it("drops fully blank rows", () => {
    const csv = "name,email\nJohn,j@x.com\n,\nJane,jane@x.com\n";
    const rows = parseCsvBuffer(Buffer.from(csv));
    expect(rows).toHaveLength(2);
  });

  it("strips a UTF-8 BOM sometimes added by Excel exports", () => {
    const csv = "\uFEFFname,email\nJohn,j@x.com\n";
    const rows = parseCsvBuffer(Buffer.from(csv));
    expect(rows[0]).toEqual({ name: "John", email: "j@x.com" });
  });

  it("throws CsvParseError for an empty file", () => {
    expect(() => parseCsvBuffer(Buffer.from(""))).toThrow(CsvParseError);
  });

  it("throws CsvParseError for a header-only file with no data rows", () => {
    expect(() => parseCsvBuffer(Buffer.from("name,email\n"))).toThrow(CsvParseError);
  });

  it("tolerates ragged rows (more/fewer columns than the header) without throwing", () => {
    const csv = "name,email,phone\nJohn,j@x.com\nJane,jane@x.com,999,extra\n";
    expect(() => parseCsvBuffer(Buffer.from(csv))).not.toThrow();
  });
});
