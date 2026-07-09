"use client";

import { useCallback, useState } from "react";
import { Download, FileJson, RefreshCcw } from "lucide-react";
import { Header } from "@/components/Header";
import { StepIndicator, Step } from "@/components/StepIndicator";
import { UploadDropzone } from "@/components/UploadDropzone";
import { CsvPreviewTable } from "@/components/CsvPreviewTable";
import { ResultsTable } from "@/components/ResultsTable";
import { SummaryStats } from "@/components/SummaryStats";
import { ProgressPanel } from "@/components/ProgressPanel";
import { SkippedRecordsPanel } from "@/components/SkippedRecordsPanel";
import { ErrorBanner } from "@/components/ErrorBanner";
import { parseCsvFile, ParsedCsv } from "@/lib/csv";
import { importCsvFile } from "@/lib/api";
import { downloadAsCsv, downloadAsJson } from "@/lib/download";
import { ExtractionResult, ImportProgress } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleFileSelected = useCallback(async (selected: File) => {
    setError(null);
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    try {
      const csv = await parseCsvFile(selected);
      setFile(selected);
      setParsed(csv);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file || !parsed) return;
    setStep("processing");
    setError(null);
    setWarnings([]);
    setProgress({ batchesCompleted: 0, batchesTotal: 0, rowsProcessed: 0, rowsTotal: parsed.rowCount });

    await importCsvFile(file, (event) => {
      if (event.type === "progress") setProgress(event.progress);
      if (event.type === "batch_error") {
        setWarnings((prev) => [...prev, `A batch had trouble and was retried: ${event.message}`]);
      }
      if (event.type === "done") {
        setResult(event.result);
        setStep("results");
      }
      if (event.type === "error") {
        setError(event.message);
        setStep("preview");
      }
    });
  }, [file, parsed]);

  const handleReset = useCallback(() => {
    setFile(null);
    setParsed(null);
    setResult(null);
    setProgress(null);
    setError(null);
    setWarnings([]);
    setStep("upload");
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <Header />
      <StepIndicator current={step} />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {step === "upload" && <UploadDropzone onFileSelected={handleFileSelected} />}

      {step === "preview" && parsed && (
        <div className="flex flex-col gap-4">
          <CsvPreviewTable data={parsed} />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Choose a different file
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Confirm &amp; Import {parsed.rowCount.toLocaleString()} row{parsed.rowCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      {step === "processing" && <ProgressPanel progress={progress} />}

      {step === "results" && result && (
        <div className="flex flex-col gap-5">
          <SummaryStats result={result} />

          {warnings.length > 0 && (
            <ErrorBanner message={`${warnings.length} batch(es) needed a retry along the way, but the import still completed.`} />
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-text)]">
              Imported records
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadAsCsv(result.imported)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              >
                <Download size={14} /> CSV
              </button>
              <button
                type="button"
                onClick={() => downloadAsJson(result.imported)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              >
                <FileJson size={14} /> JSON
              </button>
            </div>
          </div>

          <ResultsTable records={result.imported} />
          <SkippedRecordsPanel skipped={result.skipped} />

          <div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              <RefreshCcw size={14} /> Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
