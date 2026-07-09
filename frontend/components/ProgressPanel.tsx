import { Sparkles } from "lucide-react";
import { ImportProgress } from "@/lib/types";

export function ProgressPanel({ progress }: { progress: ImportProgress | null }) {
  const pct =
    progress && progress.batchesTotal > 0
      ? Math.round((progress.batchesCompleted / progress.batchesTotal) * 100)
      : 0;

  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-[var(--color-signal-soft)] text-[var(--color-signal)]">
        <Sparkles size={26} />
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-text)]">
          Mapping your data to the GrowEasy CRM format&hellip;
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {progress
            ? `Processed ${progress.rowsProcessed.toLocaleString()} of ${progress.rowsTotal.toLocaleString()} rows`
            : "Starting up…"}
        </p>
      </div>
      <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-[family-name:var(--font-data)] text-xs text-[var(--color-text-faint)]">
        {progress ? `Batch ${progress.batchesCompleted} of ${progress.batchesTotal} · ${pct}%` : ""}
      </p>
    </div>
  );
}
