import { motion } from "motion/react";
import type { TimelineEntry } from "../types";
import { SectionLabel } from "./ui";
import { ease } from "../types";

function formatRelativeTime(dateStr: string): string {
  const date  = new Date(dateStr);
  const today = new Date();
  const todayMid = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const entryMid = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((todayMid - entryMid) / 86_400_000);

  if (diffDays === 0)  return "Today";
  if (diffDays === 1)  return "Yesterday";
  if (diffDays <= 6)   return `${diffDays} days ago`;
  if (diffDays <= 13)  return "Last week";
  if (diffDays <= 20)  return "2 weeks ago";
  if (diffDays <= 27)  return "3 weeks ago";
  if (diffDays <= 59)  return "Earlier this month";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface EntryCardProps {
  entry:   TimelineEntry;
  index:   number;
  reduced: boolean;
}

function TimelineEntryCard({ entry, index, reduced }: EntryCardProps) {
  const relativeTime = formatRelativeTime(entry.date);

  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, delay: reduced ? 0 : index * 0.10, ease }}
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
      <time
        dateTime={entry.date}
        className="block text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground/40 uppercase mb-3 select-none"
      >
        {relativeTime}
      </time>

      <h3 className="text-[14px] font-medium text-foreground leading-snug mb-3">
        {entry.headline}
      </h3>

      <p className="text-[13.5px] text-muted-foreground leading-[1.82] mb-5">
        {entry.narrative}
      </p>

      {(entry.observationBasis || entry.category) && (
        <footer className="text-[11px] text-muted-foreground/32 leading-none">
          {entry.observationBasis && <span>{entry.observationBasis}</span>}
          {entry.observationBasis && entry.category && (
            <span className="mx-1.5 opacity-60" aria-hidden="true">·</span>
          )}
          {entry.category && <span>{entry.category}</span>}
        </footer>
      )}
    </motion.li>
  );
}

function TimelineIntro({ reduced }: { reduced: boolean }) {
  return (
    <motion.p
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.06, ease }}
      className="text-[13px] text-muted-foreground/55 leading-[1.78] mb-8"
    >
      A narrative of engineering change — what Nebula has observed evolving over time.
    </motion.p>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.72]">
        Nebula doesn{"'"}t yet have enough historical observations to describe infrastructure evolution.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        As additional understandings are collected, meaningful changes will appear here.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.72]">
        Infrastructure history is currently unavailable.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        You can continue exploring the current understanding below.
      </p>
    </div>
  );
}

interface TimelineSectionProps {
  timeline:  TimelineEntry[];
  reduced:   boolean;
  hasError?: boolean;
}

export function TimelineSection({
  timeline,
  reduced,
  hasError = false,
}: TimelineSectionProps) {
  const isEmpty = !hasError && timeline.length === 0;

  return (
    <section
      aria-label="Infrastructure timeline"
      className="max-w-[720px] mx-auto px-5 sm:px-10 mb-14 sm:mb-16"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
      >
        <SectionLabel>Timeline</SectionLabel>
      </motion.div>

      {hasError ? (
        <ErrorState />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <TimelineIntro reduced={reduced} />

          <ol aria-label="Infrastructure evolution timeline">
            {timeline.map((entry, i) => (
              <TimelineEntryCard
                key={entry.date + entry.headline}
                entry={entry}
                index={i}
                reduced={reduced}
              />
            ))}
          </ol>

          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: timeline.length * 0.10 + 0.12, ease }}
            className="mt-10 pt-3 border-t border-border"
            aria-hidden="true"
          >
            <p className="text-[11px] text-muted-foreground/28 leading-none tracking-wide">
              Based on publicly observable infrastructure signals collected over time.
            </p>
          </motion.div>
        </>
      )}
    </section>
  );
}

export default TimelineSection;
