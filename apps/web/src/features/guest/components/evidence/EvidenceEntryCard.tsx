import { useState, useCallback, useId } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { EvidenceRow } from "../../types";
import { emit } from "../../analytics";
import { ease } from "../common";
import { EvidenceMetadata } from "./EvidenceMetadata";
import { EvidenceRelationships } from "./EvidenceRelationships";
import { PayloadViewer } from "./PayloadViewer";

interface EvidenceEntryCardProps {
  entry:   EvidenceRow;
  index:   number;
  reduced: boolean;
}

export function EvidenceEntryCard({ entry, index, reduced }: EvidenceEntryCardProps) {
  const [payloadOpen, setPayloadOpen] = useState(false);
  const payloadId = useId();

  const handleReveal = useCallback(() => {
    if (!payloadOpen) {
      emit("EVIDENCE_EXPANDED", { entryId: entry.id, category: entry.category });
    }
    setPayloadOpen((v) => !v);
  }, [payloadOpen, entry.id, entry.category]);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: reduced ? 0 : index * 0.06, ease }}
      className="py-6 border-b border-border first:border-t cursor-default"
    >
      <p className="text-[13.5px] font-medium text-foreground leading-snug mb-2.5">
        {entry.title}
      </p>

      <p className="text-[13px] text-muted-foreground leading-[1.78] mb-4">
        {entry.summary}
      </p>

      <EvidenceRelationships
        relatedTechnologies={entry.relatedTechnologies}
        relatedObservations={entry.relatedObservations}
      />

      <EvidenceMetadata
        collectedAt={entry.collectedAt}
        source={entry.source}
        collector={entry.collector}
        hash={entry.hash}
      />

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

      <PayloadViewer
        open={payloadOpen}
        payloadId={payloadId}
        title={entry.title}
        source={entry.source}
        payload={entry.payload}
        entryId={entry.id}
      />
    </motion.div>
  );
}
