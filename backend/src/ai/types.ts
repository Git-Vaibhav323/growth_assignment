import { z } from "zod";

/** The only allowed values for crm_status, per the assignment spec. */
export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

/** The only allowed values for data_source (blank is allowed when unsure). */
export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

/**
 * One CSV row, in its original, arbitrary shape. Column names are whatever
 * the source export used ("Full Name", "email_id", "Contact No.", ...).
 */
export type RawRow = Record<string, string>;

/**
 * What the AI model must return for a single row. `row_index` is how a
 * batch response gets matched back to the row it came from, since row order
 * is not something we should ever fully rely on an LLM to preserve exactly.
 */
export const CrmRecordSchema = z.object({
  row_index: z.number().int().nonnegative(),
  created_at: z.string(),
  name: z.string(),
  email: z.string(),
  country_code: z.string(),
  mobile_without_country_code: z.string(),
  company: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  lead_owner: z.string(),
  crm_status: z.enum(CRM_STATUS_VALUES),
  crm_note: z.string(),
  data_source: z.union([z.enum(DATA_SOURCE_VALUES), z.literal("")]),
  possession_time: z.string(),
  description: z.string(),
});
export type CrmRecordRaw = z.infer<typeof CrmRecordSchema>;

export const CrmBatchResponseSchema = z.object({
  records: z.array(CrmRecordSchema),
});
export type CrmBatchResponse = z.infer<typeof CrmBatchResponseSchema>;

/** The clean, public-facing shape once row_index (an internal detail) is stripped. */
export type CrmRecord = Omit<CrmRecordRaw, "row_index">;

/**
 * Every AI backend (OpenAI, Anthropic, the local mock) implements this one
 * method. The rest of the app never needs to know which provider is active.
 */
export interface AiProvider {
  readonly name: string;
  extractBatch(rows: RawRow[], startIndex: number): Promise<CrmRecordRaw[]>;
}
