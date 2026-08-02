import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check } from "lucide-react";
import { emit } from "../../analytics";

interface PayloadCopyButtonProps {
  value: string;
  entryId: string;
}

export function PayloadCopyButton({ value, entryId }: PayloadCopyButtonProps) {
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
