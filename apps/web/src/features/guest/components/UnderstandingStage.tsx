import { motion, AnimatePresence } from "motion/react";
import { DomainFavicon } from "../../workspace/components/identity/DomainFavicon";
import { COGNITIVE_TELEMETRY_STAGES } from "../contracts/gx-r009-live-telemetry-staging.contract";
import { ease } from "../types";

interface UnderstandingStageProps {
  phase:       "VALIDATING" | "UNDERSTANDING" | "PAUSING";
  sentenceIdx: number;
  domain?:     string;
  reduced:     boolean;
}

export function UnderstandingStage({
  phase,
  sentenceIdx,
  domain,
  reduced,
}: UnderstandingStageProps) {
  const currentStageIdx = Math.min(
    phase === "PAUSING" ? COGNITIVE_TELEMETRY_STAGES.length - 1 : sentenceIdx,
    COGNITIVE_TELEMETRY_STAGES.length - 1
  );
  const currentStage = COGNITIVE_TELEMETRY_STAGES[currentStageIdx] ?? COGNITIVE_TELEMETRY_STAGES[0];

  return (
    <section
      aria-label="Infrastructure understanding in progress"
      className="max-w-[680px] mx-auto px-5 sm:px-8 pb-24 sm:pb-28 text-center"
    >
      {/* Layer A — Persistent Domain Context Anchor (GX-R009) */}
      {domain && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-card text-xs font-mono text-muted-foreground mb-8 shadow-[0_2px_8px_rgba(16,24,20,0.045)]">
          <DomainFavicon domain={domain} size="compact" />
          <span className="tracking-[0.2em] uppercase text-[10px] text-[#5F625F] dark:text-muted-foreground font-semibold">UNDERSTANDING</span>
          <span className="text-muted-foreground/40 font-mono">&bull;</span>
          <span className="text-foreground font-mono lowercase font-semibold">{domain}</span>
        </div>
      )}

      {/* Screen Reader Polite Live Region */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {currentStage.statement} {currentStage.context}
      </p>

      {/* Layer B & Layer C — Cognitive Statement & Quiet Discovery Context */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase === "PAUSING" ? "pausing" : currentStageIdx}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease }}
          className="space-y-3 mb-8"
        >
          {/* Layer B: Primary Cognitive Statement */}
          <h2 className="font-sans font-bold text-2xl sm:text-3xl text-foreground tracking-tight leading-snug">
            {currentStage.statement}
          </h2>

          {/* Layer C: Quiet Discovery Context */}
          <p className="font-sans text-sm sm:text-base text-muted-foreground max-w-[500px] mx-auto leading-relaxed">
            {currentStage.context}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Subtle Milestone Dots (Zero Progress Meter) */}
      <div
        className="flex items-center justify-center gap-2 mb-6"
        aria-hidden="true"
      >
        {COGNITIVE_TELEMETRY_STAGES.map((stage, idx) => {
          const isCompleted = phase === "PAUSING" || idx < currentStageIdx;
          const isCurrent = phase !== "PAUSING" && idx === currentStageIdx;

          return (
            <div
              key={stage.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isCurrent
                  ? "w-8 bg-primary"
                  : isCompleted
                    ? "w-3 bg-primary/40"
                    : "w-2 bg-border"
              }`}
            />
          );
        })}
      </div>

      {/* Layer D — System State Baseline (GX-R009) */}
      <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#5F625F] dark:text-muted-foreground font-semibold">
        UNDERSTANDING &bull; LIVE WIRE
      </div>
    </section>
  );
}
