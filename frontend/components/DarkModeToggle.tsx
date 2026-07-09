"use client";

import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/lib/useDarkMode";

export function DarkModeToggle() {
  const { isDark, toggle, mounted } = useDarkMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
    >
      {/* Render Moon consistently until mounted to match the server output */}
      {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
