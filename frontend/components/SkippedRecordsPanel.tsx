"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SkippedRecord } from "@/lib/types";

export function SkippedRecordsPanel({ skipped }: { skipped: SkippedRecord[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (skipped.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-[var(--color-text)]">
          {skipped.length} row{skipped.length === 1 ? "" : "s"} skipped &mdash; view why
        </span>
        <ChevronDown
          size={16}
          className={`text-[var(--color-text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="thin-scrollbar max-h-80 overflow-auto border-t border-[var(--color-border)]">
          <ul className="divide-y divide-[var(--color-border)]">
            {skipped.map((item) => (
              <li key={item.rowIndex} className="px-4 py-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-[family-name:var(--font-data)] text-xs text-[var(--color-text-faint)]">
                    row {item.rowIndex + 1}
                  </span>
                  <span className="text-xs font-medium text-[var(--color-danger)]">{item.reason}</span>
                </div>
                <p className="mt-1 truncate font-[family-name:var(--font-data)] text-xs text-[var(--color-text-muted)]">
                  {Object.entries(item.raw)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("  ·  ") || "(empty row)"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
