// ─── Shared UI primitives ─────────────────────────────────────────────────────
// Owned by the Guest Experience component system.
// These are low-level building blocks — not page sections.

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check } from "lucide-react";

// ─── Motion ───────────────────────────────────────────────────────────────────

export const ease = [0.4, 0, 0.2, 1] as [number, number, number, number];

// ─── useReducedMotion ─────────────────────────────────────────────────────────

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ─── FadeUp ───────────────────────────────────────────────────────────────────
// Standard section entry animation.
// Each section component owns its own FadeUp invocation with component-specific timing.

export function FadeUp({
  children,
  delay = 0,
  className = "",
  reduced = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  reduced?: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.58, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground uppercase mb-7">
      {children}
    </p>
  );
}

// ─── ContentColumn ────────────────────────────────────────────────────────────
// The shared editorial column width for all result sections.

export function ContentColumn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[720px] mx-auto px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
// Appears on hover within evidence rows.
// Each instance manages its own copied state independently.

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all focus-ring"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="block"
          >
            <Check className="size-3" strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="block"
          >
            <Copy className="size-3" strokeWidth={1.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
