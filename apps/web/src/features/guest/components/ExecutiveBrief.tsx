import { motion } from "motion/react";
import type { ExecutiveBriefData, Observation } from "../types";
import { ease } from "../types";

interface ExecutiveBriefProps {
  domain:       string;
  data:         ExecutiveBriefData;
  observations?: Observation[];
  reduced:      boolean;
}

const PARA_CLASS = [
  "font-display font-normal text-[1.125rem] sm:text-[1.25rem] text-foreground leading-[1.72] tracking-[-0.015em]",
  "font-display font-normal text-[0.9375rem] sm:text-[1rem] text-foreground/80 leading-[1.76] tracking-[-0.01em]",
  "font-display font-normal text-[0.875rem] sm:text-[0.9375rem] text-foreground/50 leading-[1.8] tracking-[-0.005em]",
] as const;

function paraClass(idx: number): string {
  return PARA_CLASS[Math.min(idx, PARA_CLASS.length - 1)];
}

function fadeUp(delay: number, reduced: boolean) {
  return {
    initial:    reduced ? false as const : { opacity: 0, y: 12 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.52, delay: reduced ? 0 : delay, ease },
  };
}

function EmptyBriefState({ reduced }: { reduced: boolean }) {
  return (
    <div className="space-y-5" {...fadeUp(0.12, reduced)}>
      <p className={paraClass(0)}>
        Nebula didn{"'"}t identify any significant observations from the available public infrastructure.
      </p>
      <p className={paraClass(2)}>
        The observed infrastructure appears consistent with common deployment practices.
      </p>
    </div>
  );
}

function ErrorBriefState({ reduced }: { reduced: boolean }) {
  return (
    <div className="space-y-5" {...fadeUp(0.12, reduced)}>
      <p className={paraClass(0)}>
        Nebula couldn{"'"}t prepare an Executive Brief from the available public signal.
      </p>
      <p className={paraClass(2)}>
        You can still explore the collected evidence below.
      </p>
    </div>
  );
}

interface SeverityMetricsProps {
  observations?: Observation[];
  stats:         ExecutiveBriefData["stats"];
  delay:         number;
  reduced:       boolean;
}

function SeverityMetrics({ observations, stats, delay, reduced }: SeverityMetricsProps) {
  const criticalCount = observations
    ? observations.filter((o) => o.severity?.toLowerCase() === "critical").length
    : (stats.criticalCount ?? 0);

  const highCount = observations
    ? observations.filter((o) => o.severity?.toLowerCase() === "high").length
    : 0;

  const mediumCount = observations
    ? observations.filter((o) => o.severity?.toLowerCase() === "medium").length
    : 0;

  const lowCount = observations
    ? observations.filter((o) => o.severity?.toLowerCase() === "low").length
    : 0;

  const items = [
    { count: criticalCount, label: "Critical" },
    { count: highCount,     label: "High"     },
    { count: mediumCount,   label: "Medium"   },
    { count: lowCount,      label: "Low"      },
  ];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.48, delay: reduced ? 0 : delay, ease }}
      className="mt-8 sm:mt-9 pt-6 border-t border-border"
      aria-label="Severity findings summary"
    >
      <div className="flex flex-wrap items-center gap-x-7 sm:gap-x-8 gap-y-3">
        {items.map(({ count, label }) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-semibold tabular-nums text-foreground">
              {count}
            </span>
            <span className="text-[13px] font-medium text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ExecutiveBrief({ domain, data, observations, reduced }: ExecutiveBriefProps) {
  const paragraphs    = data.paragraphs ?? [];
  const hasBriefError = data.briefError === true;
  const isEmpty       = !hasBriefError && paragraphs.length === 0;

  const PARA_DELAY   = (i: number) => 0.12 + i * 0.20;
  const lastParaIdx  = Math.max(paragraphs.length - 1, 0);
  const METRICS_DELAY = reduced ? 0 : PARA_DELAY(lastParaIdx) + 0.36;

  return (
    <section
      aria-label="Executive Brief"
      className="max-w-[720px] mx-auto px-5 sm:px-10 mb-12 sm:mb-16"
    >
      <motion.header
        {...fadeUp(0, reduced)}
        className="mb-6 space-y-2"
      >
        <h1 className="font-mono text-[1.125rem] sm:text-[1.25rem] font-bold tracking-[0.18em] text-foreground uppercase truncate">
          {domain.toUpperCase()}
        </h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Infrastructure understood
          </span>
        </div>
      </motion.header>

      {hasBriefError ? (
        <ErrorBriefState reduced={reduced} />
      ) : isEmpty ? (
        <EmptyBriefState reduced={reduced} />
      ) : (
        <div className="space-y-[1.125rem]">
          {paragraphs.slice(0, 3).map((text, i) => (
            <motion.p
              key={i}
              {...fadeUp(PARA_DELAY(i), reduced)}
              className={paraClass(i)}
            >
              {text}
            </motion.p>
          ))}
        </div>
      )}

      <SeverityMetrics
        observations={observations}
        stats={data.stats}
        delay={METRICS_DELAY}
        reduced={reduced}
      />
    </section>
  );
}

export default ExecutiveBrief;
