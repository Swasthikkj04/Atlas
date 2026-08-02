import { motion, AnimatePresence } from "motion/react";
import { ease } from "../common";
import { PayloadCopyButton } from "./PayloadCopyButton";

interface PayloadViewerProps {
  open:      boolean;
  payloadId: string;
  title:     string;
  source?:   string;
  payload:   string;
  entryId:   string;
}

export function PayloadViewer({
  open,
  payloadId,
  title,
  source,
  payload,
  entryId,
}: PayloadViewerProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={payloadId}
          role="region"
          aria-label={`Evidence payload: ${title}`}
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
                {source ?? "Evidence"}
              </span>
              <PayloadCopyButton value={payload} entryId={entryId} />
            </div>
            <pre className="px-4 py-4 text-[11.5px] text-foreground/55 font-mono leading-[1.72] whitespace-pre-wrap break-all overflow-x-auto select-text">
              {payload}
            </pre>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
