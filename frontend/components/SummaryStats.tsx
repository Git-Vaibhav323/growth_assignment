import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import { ExtractionResult } from "@/lib/types";

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "good" | "bad";
}) {
  const toneColor =
    tone === "good" ? "var(--color-accent)" : tone === "bad" ? "var(--color-danger)" : "var(--color-text)";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div style={{ color: toneColor }}>{icon}</div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold" style={{ color: toneColor }}>
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

export function SummaryStats({ result }: { result: ExtractionResult }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard icon={<ListChecks size={20} />} label="Total rows processed" value={result.totalRows} tone="neutral" />
      <StatCard icon={<CheckCircle2 size={20} />} label="Imported" value={result.totalImported} tone="good" />
      <StatCard icon={<XCircle size={20} />} label="Skipped" value={result.totalSkipped} tone="bad" />
    </div>
  );
}
