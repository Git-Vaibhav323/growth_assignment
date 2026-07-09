import { CRM_STATUS_VALUES, CrmRecordRaw, DATA_SOURCE_VALUES } from "../ai/types";

/**
 * Deliberate design choice: fuzzy work (which column is the name? are these
 * two phone numbers?) is left to the AI, guided by the prompt. But the few
 * *hard* business rules from the spec — the status/source enums, the
 * new Date()-parseable date format, the skip condition — are re-checked
 * here in plain code. Even with a structured-output API constraining the
 * model, this keeps the API's guarantees from being the only thing standing
 * between a malformed value and the response, e.g. if AI_PROVIDER is later
 * swapped to a model without strict schema support.
 */

const DATA_SOURCE_SET: readonly string[] = DATA_SOURCE_VALUES;
const STATUS_SET: readonly string[] = CRM_STATUS_VALUES;

export function shouldSkip(record: CrmRecordRaw): boolean {
  return record.email.trim() === "" && record.mobile_without_country_code.trim() === "";
}

export function validateAndRepair(record: CrmRecordRaw): CrmRecordRaw {
  return {
    ...record,
    crm_status: STATUS_SET.includes(record.crm_status) ? record.crm_status : "GOOD_LEAD_FOLLOW_UP",
    data_source: DATA_SOURCE_SET.includes(record.data_source) ? record.data_source : "",
    created_at: normalizeDate(record.created_at),
    mobile_without_country_code: record.mobile_without_country_code.replace(/[^\d]/g, ""),
    email: record.email.trim(),
  };
}

/**
 * Normalizes created_at so `new Date(created_at)` is reliably parseable
 * *across environments* (not just in whichever engine tested it). GrowEasy's
 * own sample data uses "YYYY-MM-DD HH:mm:ss" with a space, which many but
 * not all JS environments parse leniently — it's rewritten to strict ISO
 * ("...THH:mm:ss") rather than relying on that leniency.
 *
 * India-based data (this is an Indian real-estate CRM) means ambiguous
 * numeric dates like "13/05/2026" are read as DD/MM/YYYY, not MM/DD/YYYY.
 *
 * If nothing can be safely parsed, returns "" — an empty string is honest;
 * a fabricated date is not.
 */
export function normalizeDate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const spaceIso = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/;
  if (spaceIso.test(trimmed)) {
    const rewritten = trimmed.replace(" ", "T");
    if (isValidDate(rewritten)) return rewritten;
  }

  if (isValidDate(trimmed)) return trimmed;

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const m = trimmed.match(dmy);
  if (m) {
    const [, d, mo, y, h = "00", mi = "00", s = "00"] = m;
    const iso = `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}T${h.padStart(2, "0")}:${mi}:${s}`;
    if (isValidDate(iso)) return iso;
  }

  return "";
}

function isValidDate(value: string): boolean {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}
