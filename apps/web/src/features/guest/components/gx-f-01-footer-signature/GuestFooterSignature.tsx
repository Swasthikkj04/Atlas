import React from 'react';
import { Sun, Monitor, Moon } from 'lucide-react';
import { ArgonionMark } from '../../../../components/branding/ArgonionMark';
import { useTheme, type ThemeMode } from '../../../../hooks/useTheme';
import {
  GX_F01_PRODUCT_SIGNATURE_TITLE,
  GX_F01_PRODUCT_SIGNATURE_SUBTITLE,
  GX_F01_PHILOSOPHY_SIGNATURE,
} from '../../contracts/gx-f-01-footer-signature.contract.ts';

interface GuestFooterSignatureProps {
  mode?: ThemeMode;
  setMode?: (m: ThemeMode) => void;
  className?: string;
}

const THEME_OPTIONS = [
  { mode: 'light' as ThemeMode, Icon: Sun, label: 'Light theme' },
  { mode: 'system' as ThemeMode, Icon: Monitor, label: 'System theme' },
  { mode: 'dark' as ThemeMode, Icon: Moon, label: 'Dark theme' },
] as const;

export const GuestFooterSignature: React.FC<GuestFooterSignatureProps> = ({
  mode: propMode,
  setMode: propSetMode,
  className = '',
}) => {
  const defaultTheme = useTheme();
  const currentMode = propMode ?? defaultTheme.mode;
  const handleSetMode = propSetMode ?? defaultTheme.setMode;

  return (
    <footer
      role="contentinfo"
      aria-label="Nebula Product Signature"
      className={`border-t border-border/60 dark:border-border/40 py-6 sm:py-8 mt-12 sm:mt-16 text-xs font-mono text-[#5F625F] dark:text-muted-foreground transition-colors ${className}`}
    >
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-8">
        {/* 1. Left: Product Signature */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ArgonionMark size={14} className="text-foreground/70 shrink-0" />
            <span className="font-mono font-bold text-xs tracking-[0.14em] uppercase text-foreground">
              {GX_F01_PRODUCT_SIGNATURE_TITLE}
            </span>
          </div>
          <span className="text-muted-foreground/40 hidden sm:inline">&bull;</span>
          <span className="text-[11px] sm:text-xs text-[#5F625F] dark:text-muted-foreground">
            {GX_F01_PRODUCT_SIGNATURE_SUBTITLE}
          </span>
        </div>

        {/* 2. Center: Philosophy Signature */}
        <div className="text-[11px] sm:text-xs text-[#5F625F]/85 dark:text-muted-foreground/75 font-sans tracking-tight text-center md:text-left">
          {GX_F01_PHILOSOPHY_SIGNATURE}
        </div>

        {/* 3. Far Right: Appearance Controls */}
        <div
          role="group"
          aria-label="Appearance controls"
          className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-full border border-border/60 shrink-0"
        >
          {THEME_OPTIONS.map(({ mode: m, Icon, label }) => {
            const active = currentMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleSetMode(m)}
                aria-label={label}
                aria-pressed={active}
                className={`size-6 rounded-full flex items-center justify-center transition-all cursor-pointer focus-ring ${
                  active
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground/40 hover:text-muted-foreground'
                }`}
              >
                <Icon className="size-3" strokeWidth={active ? 2 : 1.5} />
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
