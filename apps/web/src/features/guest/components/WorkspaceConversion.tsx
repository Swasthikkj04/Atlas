import { motion } from "motion/react";
import type { GuestPhase } from "../types";
import { ease } from "../types";

interface WorkspaceConversionProps {
  phase: GuestPhase;
  domain?: string;
  sessionId?: string;
  jobId?: string;
  onConvert: () => void;
  onContinue?: () => void;
  reduced: boolean;
}

export function WorkspaceConversion({
  domain,
  sessionId,
  jobId,
  onConvert,
  reduced,
}: WorkspaceConversionProps) {
  const handleCreate = () => {
    try {
      if (sessionId || domain) {
        sessionStorage.setItem(
          'nebula_guest_claim',
          JSON.stringify({
            sessionId: sessionId || '',
            domain: domain || '',
            jobId: jobId || '',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
        );
      }
    } catch {
      // storage fallback
    }

    onConvert();
  };

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.42, ease }}
      aria-label="Keep this understanding"
      className="max-w-[1200px] mx-auto px-5 sm:px-10 pb-8 sm:pb-12"
    >
      <div className="py-4 sm:py-5 px-4 sm:px-5 bg-surface-preserve border-t border-b border-border/60 lg:flex lg:items-center lg:justify-between lg:gap-8">
        <div className="space-y-1.5 max-w-[620px]">
          <h2 className="font-mono text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
            Keep this understanding
          </h2>

          <p className="font-display font-medium text-[1.125rem] sm:text-[1.25rem] text-foreground tracking-[-0.015em] leading-snug">
            This understanding is temporary.
          </p>

          <p className="font-display text-[0.875rem] sm:text-[0.9375rem] text-muted-foreground leading-[1.55]">
            Preserve this infrastructure understanding, track what changes next, and build its history in a Nebula workspace.
          </p>
        </div>

        <div className="pt-3.5 lg:pt-0 shrink-0">
          <button
            type="button"
            onClick={handleCreate}
            className="group inline-flex items-center gap-2 bg-foreground px-5 py-2.5 sm:px-5.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[13px] sm:text-[13.5px] font-medium text-background hover:opacity-90 active:opacity-75 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)] cursor-pointer focus-ring"
            style={{ color: "var(--background)" }}
          >
            <span>Create Workspace</span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-150 ease-out group-hover:translate-x-0.5 select-none"
            >
              →
            </span>
          </button>
        </div>
      </div>
    </motion.section>
  );
}

export default WorkspaceConversion;
