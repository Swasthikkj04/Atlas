import { motion } from "motion/react";
import { ArrowRight, History, Bell, Layers } from "lucide-react";
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
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.45, ease }}
      aria-label="Keep this understanding"
      className="max-w-[1480px] xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 pb-12 sm:pb-16"
    >
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-card via-card/90 to-primary/5 border border-border/90 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-[680px]">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-[10.5px] uppercase font-bold tracking-wider">
              <span>Workspace Continuity</span>
            </div>

            <h2 className="font-display font-medium text-[1.375rem] sm:text-[1.625rem] text-foreground tracking-[-0.015em] leading-snug">
              Preserve this understanding in a Nebula Workspace.
            </h2>

            <p className="font-sans text-[13.5px] sm:text-[14px] text-muted-foreground leading-relaxed">
              Guest snapshots expire after 24 hours. Create a workspace to continuously monitor <strong className="text-foreground">{domain || "your domain"}</strong>, detect configuration drift automatically, and maintain an immutable historical lineage of every infrastructure change.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCreate}
              className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl text-[14px] font-medium hover:opacity-95 active:opacity-85 transition-all shadow-[0_2px_12px_rgba(26,86,219,0.28)] hover:shadow-[0_4px_16px_rgba(26,86,219,0.38)] cursor-pointer focus-ring"
            >
              <span>Create Free Workspace</span>
              <ArrowRight
                className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50 text-[12.5px]">
          <div className="flex items-start gap-2.5 text-muted-foreground">
            <History className="size-4 text-cyan-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground font-medium block">Continuous Drift Tracking</strong>
              Automated periodic re-scans with visual change diffs.
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-muted-foreground">
            <Bell className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground font-medium block">Proactive Alerting</strong>
              Instant notifications when certificates or DNS records change.
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-muted-foreground">
            <Layers className="size-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground font-medium block">Multi-Domain Portfolio</strong>
              Organize and monitor all your environments in one pane.
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default WorkspaceConversion;
