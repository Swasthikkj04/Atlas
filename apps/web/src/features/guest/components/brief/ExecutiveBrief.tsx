import { useEffect } from "react";
import { motion } from "motion/react";
import type { ExecutiveBriefData } from "../../types";
import { emit } from "../../analytics";
import { ease } from "../common";

interface ExecutiveBriefProps {
  domain:  string;
  data:    ExecutiveBriefData;
  reduced: boolean;
}

const PARA_CLASS = [
  "font-display font-normal text-[1.1875rem] sm:text-[1.3125rem] text-foreground leading-[1.72] tracking-[-0.015em]",
  "font-display font-normal text-[1rem] sm:text-[1.125rem] text-foreground leading-[1.76] tracking-[-0.01em]",
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

interface MetricsProps {
  stats:   ExecutiveBriefData["stats"];
  delay:   number;
  reduced: boolean;
}

function SummaryMetrics({ stats, delay, reduced }: MetricsProps) {
  const items = [
    { count: stats.techCount,        label: "Technologies"    },
    { count: stats.observationCount, label: "Observations"    },
    { count: stats.evidenceCount,    label: "Evidence"        },
    { count: stats.timelineCount,    label: "Timeline Events" },
  ];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.48, delay: reduced ? 0 : delay, ease }}
      className="mt-9 sm:mt-10 pt-6 border-t border-border"
      aria-label="Assessment summary"
    >
      <div className="flex flex-wrap gap-x-7 sm:gap-x-8 gap-y-3">
        {items.map(({ count, label }) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-medium tabular-nums text-foreground">
              {count}
            </span>
            <span className="text-[12.5px] text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ExecutiveBrief({ domain, data, reduced }: ExecutiveBriefProps) {
  const paragraphs    = data.paragraphs ?? [];
  const hasBriefError = data.briefError === true;
  const isEmpty       = !hasBriefError && paragraphs.length === 0;

  const PARA_DELAY   = (i: number) => 0.12 + i * 0.20;
  const lastParaIdx  = Math.max(paragraphs.length - 1, 0);
  const METRICS_DELAY = reduced ? 0 : PARA_DELAY(lastParaIdx) + 0.56;

  useEffect(() => {
    if (isEmpty || hasBriefError) return;
    if (reduced) {
      emit("EXECUTIVE_BRIEF_REVEALED", { domain });
      return;
    }
    const delay = (PARA_DELAY(lastParaIdx) + 0.52) * 1000;
    const id = setTimeout(() => emit("EXECUTIVE_BRIEF_REVEALED", { domain }), delay);
    return () => clearTimeout(id);
  }, [domain, reduced, lastParaIdx, isEmpty, hasBriefError]);

  const dateIso    = new Date().toISOString().split("T")[0];
  const dateString = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <section
      aria-label="Executive Brief"
      className="max-w-[720px] mx-auto px-5 sm:px-10 mb-16 sm:mb-20"
    >

      {/* ── 1. Document header ──────────────────────────────────────────── */}
      <motion.header
        {...fadeUp(0, reduced)}
        className="flex items-start justify-between gap-6 mb-6"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.26em] text-muted-foreground uppercase mb-2 truncate">
            {domain}
          </p>
          <h2 className="font-display font-normal text-[1.625rem] sm:text-[1.875rem] leading-[1.1] tracking-[-0.025em] text-foreground">
            Executive Brief
          </h2>
        </div>

        <div className="text-right shrink-0 pt-1">
          <time dateTime={dateIso} className="block text-[11.5px] text-muted-foreground">
            {dateString}
          </time>
          <p className="text-[11px] text-muted-foreground/38 mt-0.5 select-none">
            Infrastructure understood
          </p>
        </div>
      </motion.header>

      {/* ── 2. Supporting line ──────────────────────────────────────────── */}
      <motion.p
        {...fadeUp(0.07, reduced)}
        className="font-display italic text-[13px] text-muted-foreground/55 mb-7 leading-[1.6]"
      >
        Based on publicly observable infrastructure at this moment in time.
      </motion.p>

      {/* ── 3. Divider ──────────────────────────────────────────────────── */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: reduced ? 0 : 0.10, ease }}
        className="border-t border-border mb-9 sm:mb-10"
        aria-hidden="true"
      />

      {/* ── 4–6. Narrative or state variants ─────────────────────────────── */}
      {hasBriefError ? (
        <ErrorBriefState reduced={reduced} />
      ) : isEmpty ? (
        <EmptyBriefState reduced={reduced} />
      ) : (
        <div className="space-y-[1.375rem]">
          {paragraphs.map((text, i) => (
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

      {/* ── 7. Summary Metrics — after all paragraphs ─────────────────── */}
      <SummaryMetrics
        stats={data.stats}
        delay={METRICS_DELAY}
        reduced={reduced}
      />

    </section>
  );
}
