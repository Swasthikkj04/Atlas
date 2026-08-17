// ─── ObservationsSection ─────────────────────────────────────────────────────
//
// GX-009: Infrastructure Observations — what deserves engineering attention.
//
// SX-006: "Observations" in all user-visible language. Never "Findings".
//
// Each observation is a professional engineering note — not a scanner finding:
//   <article>
//     Guidance label (maps severity → "Immediate attention / Worth reviewing / Informational")
//     <h3> Title
//     <p>  Narrative
//     <section> Why it matters
//     <footer>  Supporting metadata (confidence, evidence count, category)
//   </article>
//
// Severity language is NEVER displayed. It maps to guidance only:
//   critical / high  → "Immediate attention"
//   medium           → "Worth reviewing"
//   low / informational → "Informational"
//
// Motion: index × 0.12 delay, fade upward.
// Hover: very subtle tint, cursor-default — observation is a document, not a widget.
//
// Accessibility:
//   <section> landmark, each observation is <article> with <h3> heading.
//   Reading order: guidance → title → narrative → why it matters → metadata.
//
// Analytics: OBSERVATIONS_REVEALED fires once on mount.

import { useEffect } from "react";
import { motion } from "motion/react";
import type { Observation, ObservationSeverity, ObservationConfidence } from "./types";
import { emit } from "./analytics";
import { SectionLabel, ease } from "./ui";

// ── Severity → guidance language (GX-009) ────────────────────────────────────

const GUIDANCE: Record<ObservationSeverity, string> = {
  critical:      "Immediate attention",
  high:          "Immediate attention",
  medium:        "Worth reviewing",
  low:           "Informational",
  informational: "Informational",
};

// ── Confidence → meta language (mirrors GX-008 for consistency) ───────────────

const CONFIDENCE_LABEL: Record<ObservationConfidence, string> = {
  high:   "Observed consistently",
  medium: "Observed across multiple signals",
  low:    "Observed with limited evidence",
};

// ── ObservationCard ───────────────────────────────────────────────────────────

interface ObservationCardProps {
  obs:     Observation;
  index:   number;
  reduced: boolean;
}

function ObservationCard({ obs, index, reduced }: ObservationCardProps) {
  const guidanceLabel  = obs.severity ? GUIDANCE[obs.severity] : null;
  const confidenceText = obs.confidence ? CONFIDENCE_LABEL[obs.confidence] : null;

  // Build the metadata footer tokens
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
      {/* Guidance label — severity mapped to plain language; displayed quietly above title */}
      {guidanceLabel && (
        <p className="text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground/40 uppercase mb-3 select-none">
          {guidanceLabel}
        </p>
      )}

      {/* Title — engineering language, never shouts */}
      <h3 className="text-[14px] font-medium text-foreground leading-snug mb-3">
        {obs.label}
      </h3>

      {/* Narrative — what Nebula observed */}
      <p className="text-[13.5px] text-muted-foreground leading-[1.82] mb-5">
        {obs.body}
      </p>

      {/* Why it matters — editorial annotation */}
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

      {/* Supporting metadata — never dominates the narrative */}
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

// ── Empty state (SX-010) ──────────────────────────────────────────────────────

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

// ── Error state (SX-011) ──────────────────────────────────────────────────────

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

// ── ObservationsSection ───────────────────────────────────────────────────────

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
  // Analytics — exactly once on mount
  useEffect(() => {
    emit("OBSERVATIONS_REVEALED", { count: observations.length });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = !hasError && observations.length === 0;

  return (
    <section
      aria-label="Infrastructure observations"
      className="max-w-[720px] mx-auto px-5 sm:px-10 mb-14 sm:mb-16"
    >
      {/* Section label */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
      >
        <SectionLabel>Observations</SectionLabel>
      </motion.div>

      {/* Content */}
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
