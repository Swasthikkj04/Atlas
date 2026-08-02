import { useEffect } from "react";
import { motion } from "motion/react";
import type { Observation, ObservationSeverity, ObservationConfidence } from "../../types";
import { emit } from "../../analytics";
import { SectionLabel, ease } from "../common";

const GUIDANCE: Record<ObservationSeverity, string> = {
  critical:      "Immediate attention",
  high:          "Immediate attention",
  medium:        "Worth reviewing",
  low:           "Informational",
  informational: "Informational",
};

const CONFIDENCE_LABEL: Record<ObservationConfidence, string> = {
  high:   "Observed consistently",
  medium: "Observed across multiple signals",
  low:    "Observed with limited evidence",
};

interface ObservationCardProps {
  obs:     Observation;
  index:   number;
  reduced: boolean;
}

function ObservationCard({ obs, index, reduced }: ObservationCardProps) {
  const guidanceLabel  = obs.severity ? GUIDANCE[obs.severity] : null;
  const confidenceText = obs.confidence ? CONFIDENCE_LABEL[obs.confidence] : null;

  const metaParts: string[] = [];
  if (confidenceText)        metaParts.push(confidenceText);
  if (obs.evidenceCount)     metaParts.push(`${obs.evidenceCount} independent signal${obs.evidenceCount !== 1 ? "s" : ""}`);
  if (obs.category)          metaParts.push(obs.category);
  if (obs.firstObserved)     metaParts.push(`First observed ${obs.firstObserved}`);

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, delay: reduced ? 0 : index * 0.12, ease }}
      className="
        group
        py-7
        border-b border-border
        first:border-t
        hover:bg-accent/20
        -mx-4 px-4
        rounded
        transition-colors duration-200
        cursor-default
      "
    >
      {guidanceLabel && (
        <p className="text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground/40 uppercase mb-3 select-none">
          {guidanceLabel}
        </p>
      )}

      <h3 className="text-[14px] font-medium text-foreground leading-snug mb-3">
        {obs.label}
      </h3>

      <p className="text-[13.5px] text-muted-foreground leading-[1.82] mb-5">
        {obs.body}
      </p>

      {obs.whyItMatters && (
        <section aria-label="Why it matters" className="mb-5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/45 uppercase mb-1.5 select-none">
            Why it matters
          </p>
          <p className="text-[12.5px] text-muted-foreground/60 leading-[1.78]">
            {obs.whyItMatters}
          </p>
        </section>
      )}

      {metaParts.length > 0 && (
        <footer className="text-[11px] text-muted-foreground/32 leading-none">
          {metaParts.map((part, i) => (
            <span key={part}>
              {i > 0 && (
                <span className="mx-1.5 opacity-60" aria-hidden="true">·</span>
              )}
              {part}
            </span>
          ))}
        </footer>
      )}
    </motion.article>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.72]">
        Nebula didn{"'"}t identify any observations requiring your attention.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        The publicly observable infrastructure appears consistent with common engineering practices.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.72]">
        Infrastructure observations are currently unavailable.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        The Executive Brief and supporting technologies remain available.
      </p>
    </div>
  );
}

interface ObservationsSectionProps {
  observations: Observation[];
  reduced:      boolean;
  hasError?:    boolean;
}

export function ObservationsSection({
  observations,
  reduced,
  hasError = false,
}: ObservationsSectionProps) {
  useEffect(() => {
    emit("OBSERVATIONS_REVEALED", { count: observations.length });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = !hasError && observations.length === 0;

  return (
    <section
      aria-label="Infrastructure observations"
      className="max-w-[720px] mx-auto px-5 sm:px-10 mb-14 sm:mb-16"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
      >
        <SectionLabel>Observations</SectionLabel>
      </motion.div>

      {hasError ? (
        <ErrorState />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div
          role="list"
          aria-label="Infrastructure observations"
        >
          {observations.map((obs, i) => (
            <div role="listitem" key={obs.label}>
              <ObservationCard obs={obs} index={i} reduced={reduced} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
