// ThemeToggle — GX-004 BX-004
//
// Three-state pill: Light · System · Dark
// Fixed bottom-right. Unobtrusive. Fully keyboard-accessible.
//
// Active option: icon at full foreground opacity.
// Inactive options: muted, full hover transition.

import { Sun, Monitor, Moon } from "lucide-react";
import type { ThemeMode } from "./useTheme";

interface ThemeToggleProps {
  mode:    ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const OPTIONS = [
  { mode: "light"  as ThemeMode, Icon: Sun,     label: "Light theme"  },
  { mode: "system" as ThemeMode, Icon: Monitor, label: "System theme" },
  { mode: "dark"   as ThemeMode, Icon: Moon,    label: "Dark theme"   },
] as const;

export function ThemeToggle({ mode, setMode }: ThemeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Color theme"
      className="
        fixed bottom-5 right-5 z-50
        flex items-center
        rounded-full border border-border
        bg-card
        shadow-[0_1px_4px_rgba(0,0,0,0.07)]
        overflow-hidden
      "
    >
      {OPTIONS.map(({ mode: m, Icon, label }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-label={label}
            aria-pressed={active}
            className={`
              size-[30px] flex items-center justify-center
              transition-colors duration-200 focus-ring
              ${active
                ? "text-foreground"
                : "text-muted-foreground/35 hover:text-muted-foreground"
              }
            `}
          >
            <Icon className="size-[13px]" strokeWidth={active ? 1.75 : 1.5} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
