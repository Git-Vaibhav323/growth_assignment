"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "groweasy-theme";

export function useDarkMode() {
  // Start false to match server render (server has no DOM).
  // useEffect will sync to the real DOM value after mount.
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // The inline script in layout.tsx already toggled .dark before first paint.
    // We just read what it set so React state matches the DOM.
    const currentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(currentlyDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // localStorage unavailable — toggle still works for the session
    }
  }, [isDark, mounted]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle, mounted };
}
