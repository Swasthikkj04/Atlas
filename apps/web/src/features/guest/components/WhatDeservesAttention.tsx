import { motion } from "motion/react";
import type { Observation } from "../types";
import { ease } from "../types";
import { CANONICAL_INVESTIGATION_CTA, QUIET_STATE_CONTRACT } from "../contracts/gx-r010-meaningful-intelligence.contract";

interface WhatDeservesAttentionProps {
  observations: Observation[];
  onExplore?: () => void;
  showExploreButton?: boolean;
  reduced: boolean;
}

const SEVERITY_COLORS: Record<string, { badge: string; border: string }> = {
  critical: {
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    border: "border-l-red-500",
  },
  high: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    border: "border-l-amber-500",
  },
  medium: {
    badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    border: "border-l-yellow-500",
  },
  low: {
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    border: "border-l-blue-500",
  },
};

export function WhatDeservesAttention({
  observations,
  onExplore,
  showExploreButton = true,
  reduced,
}: WhatDeservesAttentionProps) {
  // Filter out informational findings (e.g. 'Infrastructure processed')
  const actionable = observations.filter(
    (o) =>
      o.severity &&
      o.severity.toLowerCase() !== "informational" &&
      o.severity.toLowerCase() !== "info" &&
      !o.label.toLowerCase().includes("infrastructure processed"),
  );

  // Sort by severity priority: critical -> high -> medium -> low
  const severityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sorted = [...actionable].sort(
    (a, b) =>
      (severityOrder[b.severity?.toLowerCase() ?? ""] ?? 0) -
      (severityOrder[a.severity?.toLowerCase() ?? ""] ?? 0),
  );

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.48, delay: reduced ? 0 : 0.16, ease }}
      aria-label="What deserves attention"
      className="max-w-[720px] mx-auto px-5 sm:px-10 mb-12 sm:mb-16"
    >
      <div className="mb-4 space-y-1">
        <h2 className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
          WHAT MATTERS NOW
        </h2>
        <p className="font-display font-medium text-[1.125rem] text-foreground">
          {sorted.length === 0
            ? QUIET_STATE_CONTRACT.primaryHeadline
            : sorted.length === 1
              ? "One thing deserves attention."
              : `${sorted.length} observations deserve attention.`}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="p-5 rounded-lg border border-border bg-card/40 text-[13.5px] text-muted-foreground leading-relaxed">
          {QUIET_STATE_CONTRACT.subtext}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((item, idx) => {
            const sevKey = item.severity?.toLowerCase() ?? "low";
            const colors = SEVERITY_COLORS[sevKey] ?? SEVERITY_COLORS.low;

            return (
              <motion.div
                key={item.label + idx}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.4,
                  delay: reduced ? 0 : 0.2 + idx * 0.08,
                  ease,
                }}
                className={`p-4 sm:p-5 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors border-l-4 ${colors.border}`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wider uppercase border ${colors.badge}`}
                  >
                    {item.severity}
                  </span>
                </div>

                <h3 className="font-display font-medium text-[15px] sm:text-[16px] text-foreground mb-1">
                  {item.label}
                </h3>

                <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-3">
                  {item.body}
                </p>

                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={onExplore}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-foreground/80 hover:text-foreground transition-colors group cursor-pointer focus-ring rounded"
                  >
                    <span>{CANONICAL_INVESTIGATION_CTA}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showExploreButton && onExplore && sorted.length > 0 && (
        <div className="mt-8 pt-4 flex justify-center">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-background hover:bg-accent text-[13.5px] font-medium text-foreground transition-colors shadow-sm cursor-pointer focus-ring"
          >
            <span>Explore infrastructure</span>
            <span>→</span>
          </button>
        </div>
      )}
    </motion.section>
  );
}

export default WhatDeservesAttention;
