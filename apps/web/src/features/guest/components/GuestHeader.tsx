import { motion, AnimatePresence } from "motion/react";
import { RotateCcw } from "lucide-react";
import { DomainFavicon } from "../../workspace/components/identity/DomainFavicon";
import { ArgonionMark } from "../../../components/branding/ArgonionMark";
import type { GuestPhase } from "../types";
import { ease } from "../types";
import { LivingLogo } from "./LivingLogo";
import { telemetry } from "../../../services";

interface GuestHeaderProps {
  phase:         GuestPhase;
  displayDomain: string;
  onReset:       () => void;
}

export function GuestHeader({ phase, displayDomain, onReset }: GuestHeaderProps) {
  const isUnderstood = phase === "UNDERSTOOD" || phase === "CONVERTED";

  const handleDocsClick = () => {
    telemetry.track('EXPLORE_DOCS_CTA', {
      path: '/guest',
      surface: 'docs',
      ctaLocation: 'gx_header',
    });
  };

  const handleSignInClick = () => {
    telemetry.track('SIGN_IN', {
      path: '/guest',
      surface: 'auth',
      ctaLocation: 'gx_header',
    });
  };

  return (
    <header
      role="banner"
      className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/80 shadow-2xs"
    >
      <div className="max-w-[1480px] xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 h-[64px] flex items-center justify-between gap-4">

        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.08] border border-border/80 flex items-center justify-center text-foreground shadow-xs">
              <ArgonionMark size={19} className="text-foreground" />
            </div>
            <LivingLogo phase={phase} />
            <span className="text-[12px] font-mono text-muted-foreground/45 select-none" aria-hidden="true">/</span>
            <span className="text-xs font-mono font-bold tracking-[0.22em] text-foreground uppercase select-none">
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
                className="hidden sm:flex items-center gap-2.5 min-w-0 pl-3.5 border-l border-border/60"
              >
                <DomainFavicon domain={displayDomain} size="compact" />
                <span className="text-xs sm:text-[13px] font-mono font-bold text-foreground truncate max-w-[220px]">
                  {displayDomain}
                </span>
                <button
                  onClick={onReset}
                  aria-label="Understand a different domain"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border px-2.5 py-1 rounded-lg transition-colors focus-ring shrink-0 cursor-pointer"
                >
                  <RotateCcw className="size-3" strokeWidth={2} aria-hidden="true" />
                  <span>New</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav aria-label="Site navigation" className="flex items-center gap-3 shrink-0">
          <a
            href="/docs"
            onClick={handleDocsClick}
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-lg px-2.5 py-1.5"
          >
            Docs
          </a>
          <a
            href="/login"
            onClick={handleSignInClick}
            className="text-xs sm:text-sm font-semibold text-foreground hover:bg-muted bg-card border border-border px-3 py-1.5 rounded-xl transition-all shadow-xs focus-ring"
          >
            Sign In
          </a>
        </nav>
      </div>
    </header>
  );
}

export default GuestHeader;
