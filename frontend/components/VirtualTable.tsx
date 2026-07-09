"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface TableColumn<T> {
  key: string;
  label: string;
  width?: number;
  render?: (row: T) => React.ReactNode;
  getValue: (row: T) => string;
}

interface VirtualTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  maxHeight?: number;
  emptyMessage?: string;
  monospaceData?: boolean;
}

const DEFAULT_COLUMN_WIDTH = 180;
const ROW_HEIGHT = 44;

/**
 * A div-based grid rather than a semantic <table>, on purpose: virtualizing
 * rows (rendering only what's on screen, for large CSVs) needs to
 * absolutely-position each visible row inside a container sized to the full
 * scroll height, which native <table>/<tr> layout doesn't support cleanly.
 * ARIA table/row/cell roles keep it accessible despite not using <table>.
 * The header and body share one scroll container, which is what keeps the
 * sticky header's columns in sync during horizontal scroll for free.
 */
export function VirtualTable<T>({
  columns,
  rows,
  rowKey,
  maxHeight = 480,
  emptyMessage = "No rows to show.",
  monospaceData = true,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const totalWidth = columns.reduce((sum, c) => sum + (c.width ?? DEFAULT_COLUMN_WIDTH), 0);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      role="table"
      aria-rowcount={rows.length}
      className="thin-scrollbar overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ maxHeight }}
    >
      <div style={{ minWidth: totalWidth }}>
        <div
          role="row"
          className="sticky top-0 z-10 flex border-b border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          {columns.map((col) => (
            <div
              key={col.key}
              role="columnheader"
              className="shrink-0 truncate px-3 py-2.5 font-[family-name:var(--font-display)] text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase"
              style={{ width: col.width ?? DEFAULT_COLUMN_WIDTH }}
              title={col.label}
            >
              {col.label}
            </div>
          ))}
        </div>

        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]!;
            return (
              <div
                key={rowKey(row, virtualRow.index)}
                role="row"
                className="absolute top-0 left-0 flex w-full border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-accent-soft)]/30"
                style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    role="cell"
                    className={[
                      "flex shrink-0 items-center truncate px-3 py-2 text-sm text-[var(--color-text)]",
                      monospaceData ? "font-[family-name:var(--font-data)]" : "",
                    ].join(" ")}
                    style={{ width: col.width ?? DEFAULT_COLUMN_WIDTH }}
                    title={col.getValue(row)}
                  >
                    {col.render ? col.render(row) : col.getValue(row) || (
                      <span className="text-[var(--color-text-faint)]">&mdash;</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
