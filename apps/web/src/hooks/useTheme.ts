import { useState, useEffect, useCallback } from 'react';
import type { ThemePreference } from '../features/settings/contracts/preferences.contract';

export type ThemeMode = ThemePreference;
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nebula-theme';
export const THEME_CHANGE_EVENT = 'nebula-theme-change';

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export interface UseThemeReturn {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

export function useTheme(): UseThemeReturn {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  const theme: Theme = mode === 'system' ? systemTheme : mode;

  // Apply .dark class to <html> on resolved theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Persist mode selection and broadcast across same window and tabs
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newMode);
      } catch {
        // Storage access may fail in restricted/sandboxed iframe contexts
      }
      const effectiveTheme: Theme = newMode === 'system' ? getSystemTheme() : newMode;
      applyThemeToDOM(effectiveTheme);
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, {
          detail: { mode: newMode, theme: effectiveTheme },
        })
      );
    }
  }, []);

  // Listen to same-window theme changes and cross-tab storage updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: ThemeMode }>;
      if (customEvent.detail && customEvent.detail.mode) {
        setModeState(customEvent.detail.mode);
      } else {
        setModeState(getStoredThemeMode());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        setModeState(getStoredThemeMode());
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Track OS color scheme changes when in system mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const osColor: Theme = e.matches ? 'dark' : 'light';
      setSystemTheme(osColor);
      if (mode === 'system') {
        applyThemeToDOM(osColor);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return { theme, mode, setMode };
}
