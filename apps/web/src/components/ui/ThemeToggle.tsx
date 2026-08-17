import React from 'react';
import type { ThemeMode } from '../../hooks/useTheme';

export interface ThemeToggleProps {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  className?: string;
}

const SunIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({
  className = 'size-[13px]',
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MonitorIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({
  className = 'size-[13px]',
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({
  className = 'size-[13px]',
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const OPTIONS = [
  { mode: 'light' as ThemeMode, Icon: SunIcon, label: 'Light theme' },
  { mode: 'system' as ThemeMode, Icon: MonitorIcon, label: 'System theme' },
  { mode: 'dark' as ThemeMode, Icon: MoonIcon, label: 'Dark theme' },
] as const;

export function ThemeToggle({ mode, setMode, className = '' }: ThemeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Color theme"
      className={`
        fixed bottom-5 right-5 z-50
        flex items-center
        rounded-full border border-border/60
        bg-card/90 backdrop-blur-md
        shadow-[0_1px_4px_rgba(0,0,0,0.08)]
        p-0.5
        overflow-hidden
        transition-colors duration-200
        ${className}
      `}
    >
      {OPTIONS.map(({ mode: m, Icon, label }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-label={label}
            aria-pressed={active}
            className={`
              w-[28px] h-[28px] flex items-center justify-center rounded-full
              transition-all duration-200 focus-ring outline-none
              ${
                active
                  ? 'bg-foreground/10 text-foreground font-medium'
                  : 'text-muted-foreground/40 hover:text-muted-foreground'
              }
            `}
          >
            <Icon className="w-[13px] h-[13px]" strokeWidth={active ? 1.75 : 1.5} />
          </button>
        );
      })}
    </div>
  );
}
