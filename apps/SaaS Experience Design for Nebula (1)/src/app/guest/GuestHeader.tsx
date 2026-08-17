// ─── GuestHeader ─────────────────────────────────────────────────────────────
//
// Fixed navigation bar.
// Shows domain breadcrumb and reset control when infrastructure is understood.
//
// Accessibility:
//   role="banner" — landmark for the page header
//   aria-label on reset button
//   All interactive elements keyboard-reachable with focus-ring

import { motion, AnimatePresence } from "motion/react";
import { RotateCcw } from "lucide-react";
import type { GuestPhase } from "./types";
import { ease } from "./ui";
import { LivingLogo } from "./LivingLogo";

interface GuestHeaderProps {
  phase:         GuestPhase;
  displayDomain: string;
  onReset:       () => void;
}

export function GuestHeader({ phase, displayDomain, onReset }: GuestHeaderProps) {
  const isUnderstood = phase === "UNDERSTOOD" || phase === "CONVERTED";

  return (
    <header
      role="banner"
      className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-10 h-[52px] flex items-center justify-between gap-4">

        {/* Left: living logo + domain breadcrumb */}
        <div className="flex items-center gap-4 min-w-0">
          {/* BX-001 Living Logo — constellation nodes animate around wordmark */}
          <LivingLogo phase={phase} />

          <AnimatePresence>
            {isUnderstood && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.3, ease }}
                className="hidden sm:flex items-center gap-2.5 min-w-0"
              >
                <span className="text-border select-none" aria-hidden="true">·</span>
                <span className="text-[12px] text-muted-foreground truncate max-w-[180px]">
                  {displayDomain}
                </span>
                <button
                  onClick={onReset}
                  aria-label="Understand a different domain"
                  className="flex items-center gap-1 text-[11.5px] text-muted-foreground/50 hover:text-muted-foreground transition-colors focus-ring shrink-0"
                >
                  <RotateCcw className="size-3" strokeWidth={2} aria-hidden="true" />
                  New
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: navigation */}
        <nav aria-label="Site navigation" className="flex items-center gap-1 shrink-0">
          <button className="hidden sm:block text-[12.5px] text-muted-foreground hover:text-foreground transition-colors px-3.5 py-1.5 rounded-lg hover:bg-accent focus-ring">
            Login
          </button>
          <button className="text-[12.5px] font-medium bg-foreground text-background px-3.5 py-1.5 rounded-lg hover:opacity-75 active:opacity-55 transition-opacity focus-ring">
            Create Workspace
          </button>
        </nav>
      </div>
    </header>
  );
}
