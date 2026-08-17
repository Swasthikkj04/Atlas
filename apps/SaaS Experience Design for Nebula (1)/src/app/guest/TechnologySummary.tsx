// ─── TechnologySummary ────────────────────────────────────────────────────────
//
// GX-008: Technology understanding, not inventory.
// Every row answers "What role does this play?" — not "What exists?"
//
// Layout:
//   Technology Name
//   Role statement
//   Version · Confidence language  (metadata line — only rendered when data exists)
//
// Confidence mapping (never numeric):
//   high   → "Observed consistently"
//   medium → "Observed across multiple signals"
//   low    → "Observed with limited evidence"
//
// Version: shown only when confidently detected — never "Unknown" or "N/A".
// Evidence count: shown as "N independent signals" (supplementary to confidence).
//
// Row reveal: index × 0.08 delay, fade upward.
// Hover: very light background, negative horizontal margins — selectable, not clickable.
//
// Accessibility:
//   <section> landmark, role="list" + role="listitem", reading order preserved.
//
// Analytics:
//   TECHNOLOGY_SUMMARY_REVEALED fires once on mount.

import { useEffect } from "react";
import { motion } from "motion/react";
import type { Technology, TechConfidence } from "./types";
import { emit } from "./analytics";
import { SectionLabel, ease } from "./ui";

// ── Confidence language map (GX-008) ──────────────────────────────────────────

const CONFIDENCE_LABEL: Record<TechConfidence, string> = {
  high:   "Observed consistently",
  medium: "Observed across multiple signals",
  low:    "Observed with limited evidence",
};

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.7]">
        Nebula couldn{"'"}t confidently identify publicly observable technologies.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        This does not necessarily indicate their absence.
      </p>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.7]">
        Technology understanding is currently unavailable.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        You can continue exploring the remaining infrastructure understanding.
      </p>
    </div>
  );
}

// ── TechRow ───────────────────────────────────────────────────────────────────

interface TechRowProps {
  tech:    Technology;
  index:   number;
  reduced: boolean;
}

function TechRow({ tech, index, reduced }: TechRowProps) {
  // Build the metadata tokens shown below the role statement
  const metaParts: string[] = [];
  if (tech.version) {
    metaParts.push(`Version ${tech.version}`);
  }
  if (tech.evidenceCount != null) {
    metaParts.push(`${tech.evidenceCount} independent signal${tech.evidenceCount !== 1 ? "s" : ""}`);
  }

  const confidenceLabel = CONFIDENCE_LABEL[tech.confidence];

  return (
    <motion.div
      role="listitem"
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: reduced ? 0 : index * 0.08, ease }}
      className="
        group
        py-5
        border-b border-border
        first:border-t
        hover:bg-accent/30
        -mx-4 px-4
        rounded
        transition-colors duration-200
        cursor-default
      "
    >
      {/* Technology name */}
      <p className="text-[13.5px] font-medium text-foreground mb-1 leading-snug">
        {tech.name}
      </p>

      {/* Role statement — the core of every row */}
      <p className="text-[13px] text-muted-foreground leading-[1.68] mb-2">
        {tech.role}
      </p>

      {/* Metadata line — confidence + optional version + evidence count */}
      <p className="text-[11.5px] text-muted-foreground/45 leading-none">
        {confidenceLabel}
        {metaParts.length > 0 && (
          <>
            <span className="mx-1.5 opacity-50" aria-hidden="true">·</span>
            {metaParts.join(" · ")}
          </>
        )}
      </p>
    </motion.div>
  );
}

// ── TechnologySummary ─────────────────────────────────────────────────────────

interface TechnologySummaryProps {
  technologies: Technology[];
  reduced:      boolean;
  error?:       boolean;  // true → show error recovery state
}

export function TechnologySummary({
  technologies,
  reduced,
  error = false,
}: TechnologySummaryProps) {
  // Analytics — fires exactly once when this section mounts
  useEffect(() => {
    emit("TECHNOLOGY_SUMMARY_REVEALED", { count: technologies.length });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = !error && technologies.length === 0;

  return (
    <section
      aria-label="Technologies"
      className="max-w-[720px] mx-auto px-5 sm:px-8 mb-14 sm:mb-16"
    >
      {/* Section label */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
      >
        <SectionLabel>Technologies</SectionLabel>
      </motion.div>

      {/* Content */}
      {error ? (
        <ErrorState />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div role="list" aria-label="Observed technologies">
          {technologies.map((tech, i) => (
            <TechRow key={tech.name} tech={tech} index={i} reduced={reduced} />
          ))}
        </div>
      )}
    </section>
  );
}
