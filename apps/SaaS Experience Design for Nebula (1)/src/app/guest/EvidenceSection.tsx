// ─── EvidenceSection ──────────────────────────────────────────────────────────
//
// GX-011: Evidence Explorer — the appendix of the infrastructure report.
//
// Philosophy:
//   Evidence supports understanding. It never leads it.
//   Users arrive here after reading the Brief, Technologies, Observations, Timeline.
//
// Structure:
//   Section label → Introduction → Categories (collapsed by default) → entries
//
//   Each category: independent accordion (aria-expanded + aria-controls)
//   Each entry:    title → summary → relationships → metadata → "Reveal Evidence"
//   Payload:       lazy-mounted (not in DOM until revealed), plain text, copyable
//
// Motion: height + opacity, 180–220 ms, no bounce.
//
// Analytics:
//   EVIDENCE_EXPLORER_REVEALED — once on mount
//   EVIDENCE_EXPANDED          — per payload reveal
//   EVIDENCE_COPIED            — per successful payload copy

import { useState, useCallback, useEffect, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Copy, Check } from "lucide-react";
import type { EvidenceRow } from "./types";
import { emit } from "./analytics";
import { SectionLabel, ease } from "./ui";

// ── Relative time for collectedAt ─────────────────────────────────────────────

function collectedLabel(dateStr: string): string {
  const date     = new Date(dateStr);
  const today    = new Date();
  const todayMid = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const entryMid = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diff     = Math.round((todayMid - entryMid) / 86_400_000);

  if (diff === 0) return "Collected today";
  if (diff === 1) return "Collected yesterday";
  if (diff <= 6)  return `Collected ${diff} days ago`;
  if (diff <= 13) return "Collected last week";
  return `Collected ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
}

// ── PayloadCopyButton — Copy with EVIDENCE_COPIED analytics ───────────────────

function PayloadCopyButton({ value, entryId }: { value: string; entryId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      emit("EVIDENCE_COPIED", { entryId });
      setTimeout(() => setCopied(false), 1600);
    });
  }, [value, entryId]);

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy evidence to clipboard"}
      className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors duration-150 focus-ring rounded px-1.5 py-0.5 select-none"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1"
          >
            <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
            Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1"
          >
            <Copy className="size-3" strokeWidth={1.5} aria-hidden="true" />
            Copy
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── EvidenceEntryCard ─────────────────────────────────────────────────────────

interface EntryCardProps {
  entry:   EvidenceRow;
  index:   number;
  reduced: boolean;
}

function EvidenceEntryCard({ entry, index, reduced }: EntryCardProps) {
  const [payloadOpen, setPayloadOpen] = useState(false);
  const payloadId = useId();

  const handleReveal = useCallback(() => {
    if (!payloadOpen) {
      emit("EVIDENCE_EXPANDED", { entryId: entry.id, category: entry.category });
    }
    setPayloadOpen((v) => !v);
  }, [payloadOpen, entry.id, entry.category]);

  const metaParts: string[] = [collectedLabel(entry.collectedAt)];
  if (entry.source)    metaParts.push(entry.source);
  if (entry.collector) metaParts.push(entry.collector);
  if (entry.hash)      metaParts.push("SHA-256 available");

  const hasTechs = entry.relatedTechnologies && entry.relatedTechnologies.length > 0;
  const hasObs   = entry.relatedObservations  && entry.relatedObservations.length > 0;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: reduced ? 0 : index * 0.06, ease }}
      className="py-6 border-b border-border first:border-t cursor-default"
    >
      {/* Title */}
      <p className="text-[13.5px] font-medium text-foreground leading-snug mb-2.5">
        {entry.title}
      </p>

      {/* Summary */}
      <p className="text-[13px] text-muted-foreground leading-[1.78] mb-4">
        {entry.summary}
      </p>

      {/* Relationships — quiet, no navigation yet */}
      {(hasTechs || hasObs) && (
        <div className="mb-4 space-y-1.5">
          {hasTechs && (
            <p className="text-[11px] text-muted-foreground/38 leading-none">
              <span className="font-medium">Supports</span>
              {" · "}
              {entry.relatedTechnologies!.join(" · ")}
            </p>
          )}
          {hasObs && (
            <p className="text-[11px] text-muted-foreground/38 leading-none">
              <span className="font-medium">Observation</span>
              {" · "}
              {entry.relatedObservations!.join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* Metadata footer */}
      <p className="text-[11px] text-muted-foreground/28 leading-none mb-4">
        {metaParts.map((part, i) => (
          <span key={part}>
            {i > 0 && <span className="mx-1.5 opacity-50" aria-hidden="true">·</span>}
            {part}
          </span>
        ))}
      </p>

      {/* Reveal Evidence toggle */}
      <button
        onClick={handleReveal}
        aria-expanded={payloadOpen}
        aria-controls={payloadId}
        className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors duration-150 focus-ring rounded select-none"
      >
        <motion.span
          animate={{ rotate: payloadOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease }}
        >
          <ChevronDown className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </motion.span>
        {payloadOpen ? "Collapse evidence" : "Reveal evidence"}
      </button>

      {/* Payload — lazy-mounted, plain text, selectable, copyable */}
      <AnimatePresence initial={false}>
        {payloadOpen && (
          <motion.div
            id={payloadId}
            role="region"
            aria-label={`Evidence payload: ${entry.title}`}
            key="payload"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg bg-muted/60 border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                <span className="text-[10.5px] text-muted-foreground/35 font-medium tracking-wide uppercase select-none">
                  {entry.source ?? "Evidence"}
                </span>
                <PayloadCopyButton value={entry.payload} entryId={entry.id} />
              </div>
              <pre className="px-4 py-4 text-[11.5px] text-foreground/55 font-mono leading-[1.72] whitespace-pre-wrap break-all overflow-x-auto select-text">
                {entry.payload}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── EvidenceCategoryGroup ─────────────────────────────────────────────────────

interface CategoryGroupProps {
  category: string;
  entries:  EvidenceRow[];
  reduced:  boolean;
}

function EvidenceCategoryGroup({ category, entries, reduced }: CategoryGroupProps) {
  const [open, setOpen] = useState(false);
  const panelId         = useId();

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between py-5 text-left focus-ring rounded group"
      >
        <span className="text-[13px] font-medium text-foreground/65 group-hover:text-foreground transition-colors duration-150">
          {category}
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-muted-foreground/32 tabular-nums select-none">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18, ease }}
            className="text-muted-foreground/38"
          >
            <ChevronDown className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="open"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              {entries.map((entry, i) => (
                <EvidenceEntryCard
                  key={entry.id}
                  entry={entry}
                  index={i}
                  reduced={reduced}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Supporting sub-components ─────────────────────────────────────────────────

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

// ── EvidenceSection ───────────────────────────────────────────────────────────

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

  // Group by category, preserving encounter order
  const grouped    = evidence.reduce<Map<string, EvidenceRow[]>>((acc, row) => {
    const list = acc.get(row.category) ?? [];
    list.push(row);
    acc.set(row.category, list);
    return acc;
  }, new Map());
  const categories = Array.from(grouped.entries());

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
