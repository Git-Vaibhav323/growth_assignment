// Mirrors backend/src/ai/types.ts. Kept as a manually-synced duplicate
// rather than a shared package, which keeps each app deployable on its own
// (Vercel/Render each just need their own folder, no build-order coupling) —
// a reasonable tradeoff at this project's size. See README for the note on
// this. If the two ever drift, the backend is the source of truth.

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;
export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  rowIndex: number;
  raw: Record<string, string>;
  reason: string;
}

export interface ExtractionResult {
  provider: string;
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

export interface ImportProgress {
  batchesCompleted: number;
  batchesTotal: number;
  rowsProcessed: number;
  rowsTotal: number;
}

export const CRM_COLUMNS: { key: keyof CrmRecord; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Country Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Lead Owner" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
  { key: "possession_time", label: "Possession" },
  { key: "crm_note", label: "Note" },
  { key: "description", label: "Description" },
  { key: "created_at", label: "Created At" },
];
