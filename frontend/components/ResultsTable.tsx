import { CRM_COLUMNS, CrmRecord, CrmStatus } from "@/lib/types";
import { TableColumn, VirtualTable } from "./VirtualTable";

const STATUS_LABEL: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead",
  DID_NOT_CONNECT: "Did Not Connect",
  BAD_LEAD: "Bad Lead",
  SALE_DONE: "Sale Done",
};

const STATUS_VAR: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: "good",
  DID_NOT_CONNECT: "noconnect",
  BAD_LEAD: "bad",
  SALE_DONE: "sale",
};

function StatusBadge({ status }: { status: CrmStatus }) {
  const variant = STATUS_VAR[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      style={{
        color: `var(--color-status-${variant})`,
        background: `var(--color-status-${variant}-soft)`,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ResultsTable({ records }: { records: CrmRecord[] }) {
  const columns: TableColumn<CrmRecord>[] = CRM_COLUMNS.map(({ key, label }) => ({
    key,
    label,
    width: key === "crm_note" || key === "description" ? 260 : key === "name" || key === "email" ? 200 : 160,
    getValue: (row) => String(row[key] ?? ""),
    render: key === "crm_status" ? (row) => <StatusBadge status={row.crm_status} /> : undefined,
  }));

  return (
    <VirtualTable
      columns={columns}
      rows={records}
      rowKey={(row, i) => `${row.email || row.mobile_without_country_code || "row"}-${i}`}
      emptyMessage="No records were imported."
    />
  );
}
