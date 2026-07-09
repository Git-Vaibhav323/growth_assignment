import { AiProvider, CRM_STATUS_VALUES, CrmRecordRaw, DATA_SOURCE_VALUES, RawRow } from "../types";

/**
 * A dependency-free stand-in for a real AI call, used when AI_PROVIDER=mock
 * (the default). It does simple regex-based header guessing rather than any
 * real language understanding, so its output is a reasonable demo — not a
 * substitute for real extraction. It exists so `npm install && npm run dev`
 * produces a fully working app with zero setup, and so the request/response
 * pipeline (batching, retries, SSE, validation) can be exercised without an
 * API key. Swap AI_PROVIDER to "openai" or "anthropic" for real extraction —
 * that's what the assignment is actually evaluating.
 */

const FIELD_PATTERNS: Record<string, RegExp[]> = {
  name: [/^name$/i, /full.?name/i, /lead.?name/i, /contact.?name/i, /^client$/i],
  email: [/e.?mail/i],
  mobile: [/mobile/i, /phone/i, /contact.?no/i, /whatsapp/i, /cell/i],
  company: [/company/i, /organi[sz]ation/i, /project.?name/i, /builder/i],
  city: [/^city$/i, /town/i],
  state: [/^state$/i, /province/i],
  country: [/^country$/i],
  lead_owner: [/owner/i, /agent/i, /assigned/i, /rep$/i],
  crm_status: [/status/i, /stage/i, /disposition/i, /outcome/i],
  crm_note: [/note/i, /remark/i, /comment/i],
  data_source: [/source/i, /campaign/i],
  possession_time: [/possession/i, /handover/i, /ready.?by/i],
  description: [/description/i, /detail/i, /requirement/i],
  created_at: [/created/i, /date/i, /timestamp/i],
  country_code: [/country.?code/i, /isd/i, /std/i],
};

function findByPattern(row: RawRow, patterns: RegExp[]): string {
  for (const [key, value] of Object.entries(row)) {
    if (!value || !value.trim()) continue;
    if (patterns.some((p) => p.test(key))) return value.trim();
  }
  return "";
}

function guessStatus(raw: string): (typeof CRM_STATUS_VALUES)[number] {
  const v = raw.toLowerCase();
  if (/sale|closed|won|converted/.test(v)) return "SALE_DONE";
  if (/bad|not interested|junk|invalid/.test(v)) return "BAD_LEAD";
  if (/not connect|no answer|unreachable|busy/.test(v)) return "DID_NOT_CONNECT";
  if (CRM_STATUS_VALUES.includes(raw as (typeof CRM_STATUS_VALUES)[number])) {
    return raw as (typeof CRM_STATUS_VALUES)[number];
  }
  return "GOOD_LEAD_FOLLOW_UP";
}

function guessDataSource(raw: string): (typeof DATA_SOURCE_VALUES)[number] | "" {
  const v = raw.toLowerCase().replace(/[^a-z_]/g, "_");
  if (!v) return ""; // guard: "anything".includes("") is always true in JS, so an empty
  // signal must short-circuit here rather than reach the .find() below, or it would
  // "match" the first data source value for every row with no real signal at all.
  const match = DATA_SOURCE_VALUES.find((d) => v.includes(d) || d.includes(v));
  return match ?? "";
}

function splitFirstAndRest(raw: string): { first: string; rest: string[] } {
  const parts = raw
    .split(/[,;/]| and /i)
    .map((p) => p.trim())
    .filter(Boolean);
  return { first: parts[0] ?? "", rest: parts.slice(1) };
}

export const mockProvider: AiProvider = {
  name: "mock",

  async extractBatch(rows: RawRow[], startIndex: number): Promise<CrmRecordRaw[]> {
    return rows.map((row, i) => {
      const emailRaw = findByPattern(row, FIELD_PATTERNS.email!);
      const mobileRaw = findByPattern(row, FIELD_PATTERNS.mobile!);
      const { first: email, rest: extraEmails } = splitFirstAndRest(emailRaw);
      const { first: mobileFull, rest: extraMobiles } = splitFirstAndRest(mobileRaw);

      const explicitCountryCode = findByPattern(row, FIELD_PATTERNS.country_code!);
      let countryCode = explicitCountryCode;
      let mobile = mobileFull.replace(/\D/g, "");

      // Only attempt to split an embedded country code out of the phone string
      // itself when there's no dedicated column for it AND the signal is
      // unambiguous — a literal "+" prefix, or the common unseparated Indian
      // case (12 digits starting with "91"). A bare 10-digit number is left
      // untouched: there's no reliable way to tell "987 6543210" apart from a
      // plain local number without embedded punctuation to go on.
      if (!countryCode) {
        const plusMatch = mobileFull.match(/^\+(\d{1,3})[\s-]?(\d{6,})$/);
        if (plusMatch) {
          countryCode = `+${plusMatch[1]}`;
          mobile = plusMatch[2]!.replace(/\D/g, "");
        } else if (mobile.length === 12 && mobile.startsWith("91")) {
          countryCode = "+91";
          mobile = mobile.slice(2);
        }
      }

      const noteExtras = [
        ...extraEmails.map((e) => `Additional email: ${e}`),
        ...extraMobiles.map((m) => `Additional phone: ${m}`),
      ];
      const existingNote = findByPattern(row, FIELD_PATTERNS.crm_note!);
      const crm_note = [existingNote, ...noteExtras].filter(Boolean).join("; ");

      return {
        row_index: startIndex + i,
        created_at: findByPattern(row, FIELD_PATTERNS.created_at!),
        name: findByPattern(row, FIELD_PATTERNS.name!),
        email,
        country_code: countryCode,
        mobile_without_country_code: mobile,
        company: findByPattern(row, FIELD_PATTERNS.company!),
        city: findByPattern(row, FIELD_PATTERNS.city!),
        state: findByPattern(row, FIELD_PATTERNS.state!),
        country: findByPattern(row, FIELD_PATTERNS.country!),
        lead_owner: findByPattern(row, FIELD_PATTERNS.lead_owner!),
        crm_status: guessStatus(findByPattern(row, FIELD_PATTERNS.crm_status!)),
        crm_note,
        data_source: guessDataSource(findByPattern(row, FIELD_PATTERNS.data_source!)),
        possession_time: findByPattern(row, FIELD_PATTERNS.possession_time!),
        description: findByPattern(row, FIELD_PATTERNS.description!),
      };
    });
  },
};
