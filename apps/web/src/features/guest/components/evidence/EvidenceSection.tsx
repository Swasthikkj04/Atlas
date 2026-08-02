import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import type { EvidenceRow } from "../../types";
import { emit } from "../../analytics";
import { SectionLabel, ease } from "../common";
import { EvidenceCategoryGroup } from "./EvidenceCategoryGroup";

function EvidenceIntro({ reduced }: { reduced: boolean }) {
  return (
    <motion.p
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.06, ease }}
      className="text-[13px] text-muted-foreground/55 leading-[1.78] mb-8"
    >
      Supporting evidence for the Executive Brief, Technology Summary, Observations, and Timeline.
      Select a category to inspect the underlying signals.
    </motion.p>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.72]">
        Nebula did not retain supporting evidence for this understanding.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        This may occur when publicly observable evidence is unavailable.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="py-10 text-center">
      <p className="font-display italic text-[1rem] text-muted-foreground mb-3 leading-[1.72]">
        Supporting evidence is currently unavailable.
      </p>
      <p className="text-[13px] text-muted-foreground/55 leading-[1.75]">
        The Executive Brief and Infrastructure Observations remain available.
      </p>
    </div>
  );
}

interface EvidenceSectionProps {
  evidence:  EvidenceRow[];
  reduced:   boolean;
  hasError?: boolean;
}

export function EvidenceSection({
  evidence,
  reduced,
  hasError = false,
}: EvidenceSectionProps) {
  useEffect(() => {
    emit("EVIDENCE_EXPLORER_REVEALED", { entryCount: evidence.length });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => {
    const grouped = evidence.reduce<Map<string, EvidenceRow[]>>((acc, row) => {
      const list = acc.get(row.category) ?? [];
      list.push(row);
      acc.set(row.category, list);
      return acc;
    }, new Map());
    return Array.from(grouped.entries());
  }, [evidence]);

  const isEmpty = !hasError && evidence.length === 0;

  return (
    <section
      aria-label="Supporting evidence"
      className="max-w-[720px] mx-auto px-5 sm:px-10 mb-14 sm:mb-16"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
      >
        <SectionLabel>Evidence</SectionLabel>
      </motion.div>

      {hasError ? (
        <ErrorState />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <EvidenceIntro reduced={reduced} />

          <div
            role="list"
            aria-label="Evidence categories"
            className="border-t border-border"
          >
            {categories.map(([category, entries]) => (
              <div role="listitem" key={category}>
                <EvidenceCategoryGroup
                  category={category}
                  entries={entries}
                  reduced={reduced}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
