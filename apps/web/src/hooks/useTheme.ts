import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'nebula-theme';

function storedMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function osTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface UseThemeReturn {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

export function useTheme(): UseThemeReturn {
  const [mode, setModeState] = useState<ThemeMode>(storedMode);
  const [systemTheme, setSystem] = useState<Theme>(() =>
    typeof window !== 'undefined' ? osTheme() : 'light'
  );

  const theme: Theme = mode === 'system' ? systemTheme : mode;

  // Apply .dark class to <html> on resolved theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Persist mode selection
  const setMode = (m: ThemeMode) => {
    setModeState(m);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, m);
    }
  };

  // Track OS color scheme changes when in system mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { theme, mode, setMode };
}
