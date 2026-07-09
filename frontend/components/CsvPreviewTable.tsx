import { ParsedCsv } from "@/lib/csv";
import { TableColumn, VirtualTable } from "./VirtualTable";

export function CsvPreviewTable({ data }: { data: ParsedCsv }) {
  const columns: TableColumn<Record<string, string>>[] = data.headers.map((header) => ({
    key: header,
    label: header,
    getValue: (row) => row[header] ?? "",
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">{data.fileName}</span> &middot;{" "}
          {data.rowCount.toLocaleString()} row{data.rowCount === 1 ? "" : "s"} &middot; {data.headers.length} column
          {data.headers.length === 1 ? "" : "s"} detected
        </p>
        <span className="rounded-full bg-[var(--color-signal-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-signal)]">
          Not sent to AI yet
        </span>
      </div>
      <VirtualTable columns={columns} rows={data.rows} rowKey={(_row, i) => String(i)} />
    </div>
  );
}
