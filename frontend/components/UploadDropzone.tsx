"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export function UploadDropzone({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={[
        "group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-20 text-center transition-colors",
        isDragging
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] transition-transform group-hover:scale-105">
        <UploadCloud size={26} />
      </div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-text)]">
          Drop a CSV here, or click to browse
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Facebook Lead Ads, Google Ads, Excel, real-estate CRM exports, hand-built sheets &mdash; any layout works.
        </p>
      </div>
    </div>
  );
}
