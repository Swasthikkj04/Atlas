import { useState, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { EvidenceRow } from "../../types";
import { ease } from "../common";
import { EvidenceEntryCard } from "./EvidenceEntryCard";

interface EvidenceCategoryGroupProps {
  category: string;
  entries:  EvidenceRow[];
  reduced:  boolean;
}

export function EvidenceCategoryGroup({
  category,
  entries,
  reduced,
}: EvidenceCategoryGroupProps) {
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
