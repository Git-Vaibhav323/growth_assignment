"use client";

import { AlertTriangle, X } from "lucide-react";

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 leading-relaxed">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
