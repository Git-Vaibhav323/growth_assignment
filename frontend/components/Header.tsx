import { DarkModeToggle } from "./DarkModeToggle";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] pb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-accent)] font-[family-name:var(--font-display)] text-sm font-semibold text-white">
          G
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--color-text)]">
            GrowEasy CSV Importer
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Any export, one CRM format &mdash; mapped by AI.
          </p>
        </div>
      </div>
      <DarkModeToggle />
    </header>
  );
}
