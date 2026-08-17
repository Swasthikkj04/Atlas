// Theme system — GX-004 BX-004
//
// Three modes:
//   "light"  — force light regardless of OS
//   "dark"   — force dark regardless of OS
//   "system" — follows OS prefers-color-scheme (default)
//
// The resolved Theme ("light" | "dark") drives the .dark class on <html>.
// Mode is persisted to localStorage. OS changes re-resolve when mode is "system".

import { useState, useEffect } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Theme     = "light" | "dark";

const STORAGE_KEY = "nebula-theme";

function storedMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

function osTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface UseThemeReturn {
  theme:    Theme;        // resolved: what is actually applied
  mode:     ThemeMode;   // stored: what the user selected
  setMode:  (m: ThemeMode) => void;
}

export function useTheme(): UseThemeReturn {
  const [mode, setModeState]       = useState<ThemeMode>(storedMode);
  const [systemTheme, setSystem]   = useState<Theme>(() =>
    typeof window !== "undefined" ? osTheme() : "light"
  );

  const theme: Theme = mode === "system" ? systemTheme : mode;

  // Apply .dark class to <html> on every resolved change
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Persist mode
  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  // Track OS changes (only matters when mode === "system")
  useEffect(() => {
    const mq      = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystem(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return { theme, mode, setMode };
}
