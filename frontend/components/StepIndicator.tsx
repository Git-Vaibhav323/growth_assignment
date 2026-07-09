import { Check } from "lucide-react";

export type Step = "upload" | "preview" | "processing" | "results";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "processing", label: "AI Mapping" },
  { key: "results", label: "Results" },
];

export function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center" aria-label="Import progress">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  isComplete
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : isCurrent
                      ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "border-[var(--color-border-strong)] text-[var(--color-text-faint)]",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check size={14} /> : index + 1}
              </div>
              <span
                className={[
                  "text-xs font-medium whitespace-nowrap",
                  isCurrent || isComplete ? "text-[var(--color-text)]" : "text-[var(--color-text-faint)]",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="mx-3 mb-5 h-px flex-1 bg-[var(--color-border)]">
                <div
                  className="h-px bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: isComplete ? "100%" : "0%" }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
