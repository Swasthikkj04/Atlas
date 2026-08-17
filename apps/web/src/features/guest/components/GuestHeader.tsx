import { motion, AnimatePresence } from "motion/react";
import { RotateCcw } from "lucide-react";
import type { GuestPhase } from "../types";
import { ease } from "../types";
import { LivingLogo } from "./LivingLogo";

interface GuestHeaderProps {
  phase:         GuestPhase;
  displayDomain: string;
  onReset:       () => void;
}

export function GuestHeader({ phase, displayDomain, onReset }: GuestHeaderProps) {
  const isUnderstood = phase === "UNDERSTOOD" || phase === "CONVERTED";
  const showCreateWorkspace = phase === "IDLE" || phase === "ERROR";

  return (
    <header
      role="banner"
      className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/80"
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-10 h-[64px] flex items-center justify-between gap-4">

        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2">
            <LivingLogo phase={phase} />
            <span className="text-[12px] font-mono text-muted-foreground/45 select-none px-0.5" aria-hidden="true">/</span>
            <span className="text-[12px] font-mono font-bold tracking-[0.22em] text-foreground uppercase select-none">
              Nebula
            </span>
          </div>

          <AnimatePresence>
            {isUnderstood && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.3, ease }}
                className="hidden sm:flex items-center gap-3 min-w-0 pl-3.5 border-l border-border/60"
              >
                <span className="text-[12.5px] font-mono font-medium text-foreground/90 truncate max-w-[220px]">
                  {displayDomain}
                </span>
                <button
                  onClick={onReset}
                  aria-label="Understand a different domain"
                  className="flex items-center gap-1.5 text-[11.5px] font-mono text-muted-foreground/70 hover:text-foreground transition-colors focus-ring shrink-0 cursor-pointer"
                >
                  <RotateCcw className="size-3" strokeWidth={2} aria-hidden="true" />
                  New
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav aria-label="Site navigation" className="flex items-center gap-2.5 shrink-0">
          <a
            href="/auth/login"
            className="text-[13px] font-medium text-foreground/90 hover:text-foreground border border-border/80 hover:bg-muted/50 transition-colors px-4 py-2 rounded-lg focus-ring"
          >
            Login
          </a>
          {showCreateWorkspace && (
            <a
              href="/auth/register"
              className="text-[13px] font-medium bg-foreground px-4.5 py-2.5 rounded-lg hover:opacity-85 active:opacity-65 transition-opacity focus-ring shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              style={{ color: "var(--background)" }}
            >
              Create Workspace
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

export default GuestHeader;
