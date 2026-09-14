import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { DomainFavicon } from "../../workspace/components/identity/DomainFavicon";
import type { GuestPhase } from "../types";
import {
  ease,
} from "../types";
import {
  normalizeDomainInput,
  isValidDomainInput,
} from "../contracts/gx-r006-domain-input-intent.contract";
import { CANONICAL_SAMPLE_DOMAINS } from "../contracts/gx-r005-idle-canvas.contract";
import { BackgroundConstellation } from "./BackgroundConstellation";

interface HeroSectionProps {
  phase:         GuestPhase;
  displayDomain: string;
  sections:      number;
  onSubmit:      (domain: string) => void;
  onReset:       () => void;
  reduced:       boolean;
  inputRef:      React.RefObject<HTMLInputElement>;
}

export function HeroSection({
  phase,
  displayDomain,
  sections,
  onSubmit,
  onReset,
  reduced,
  inputRef,
}: HeroSectionProps) {
  const [localDomain, setLocalDomain] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [domainError, setDomainError]  = useState<string | null>(null);

  const isActive        = phase === "IDLE" || phase === "ERROR";
  const isUnderstanding = phase === "UNDERSTANDING" || phase === "PAUSING" || phase === "VALIDATING";
  const isUnderstood    = phase === "UNDERSTOOD" || phase === "CONVERTED";
  const isIdle          = phase === "IDLE";

  const inputValue = isUnderstanding
    ? displayDomain
    : isUnderstood
      ? searchQuery
      : localDomain;

  const inputPlaceholder = isUnderstood
    ? "Ask Nebula about this infrastructure..."
    : "example.com";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUnderstood) {
      setSearchQuery(e.target.value);
    } else if (isActive) {
      setLocalDomain(e.target.value);
      if (domainError && e.target.value.trim()) setDomainError(null);
    }
  };

  const handleDomainSubmit = useCallback((targetDomain?: string) => {
    const rawInput = targetDomain ?? localDomain;
    const normalized = normalizeDomainInput(rawInput);

    if (!normalized) {
      setDomainError("Enter a valid domain.");
      inputRef.current?.focus();
      return;
    }

    if (!isValidDomainInput(normalized)) {
      setDomainError("Enter a valid domain.");
      inputRef.current?.focus();
      return;
    }

    setDomainError(null);
    setLocalDomain("");
    onSubmit(normalized);
  }, [localDomain, onSubmit, inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isActive && !isUnderstanding) {
      handleDomainSubmit();
    }
    if (e.key === "Escape" && domainError) {
      e.preventDefault();
      setDomainError(null);
    }
  };

  const handleSampleSelect = (domain: string) => {
    setLocalDomain(domain);
    setDomainError(null);
    inputRef.current?.focus();
  };

  const handleReset = useCallback(() => {
    setLocalDomain("");
    setSearchQuery("");
    setDomainError(null);
    onReset();
  }, [onReset]);

  const isValidCandidate = isValidDomainInput(normalizeDomainInput(localDomain));

  return (
    <section
      aria-label="Understand your infrastructure"
      className={`relative transition-all duration-[760ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isIdle
          ? "pt-[120px] sm:pt-[140px] md:pt-[160px] pb-[80px] sm:pb-[100px]"
          : "pt-[80px]  sm:pt-[90px]  pb-10  sm:pb-12"
      }`}
    >
      <BackgroundConstellation phase={phase} sections={sections} />

      <div className="relative max-w-[880px] mx-auto px-5 sm:px-8 text-center">
        <AnimatePresence>
          {isIdle && (
            <motion.div
              key="hero-copy"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease }}
              className="mb-8 sm:mb-10"
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 text-[#3568C8] dark:text-primary font-mono text-xs tracking-[0.2em] uppercase font-semibold mb-4">
                <Sparkles className="size-3.5" />
                <span>Passive Autonomous Reconnaissance</span>
              </div>

              {/* Zone B: Intelligence Statement */}
              <h1 className="font-sans font-bold text-[2.25rem] sm:text-[3.25rem] md:text-[3.75rem] leading-[1.12] tracking-tight text-foreground mb-4">
                Infrastructure intelligence
                <br />
                begins with understanding.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[560px] mx-auto font-normal">
                Enter a domain. Nebula will build its current understanding.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone C: Domain Intent (Input & Action) */}
        <motion.div layout="position" className="max-w-[560px] mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                disabled={isUnderstanding}
                readOnly={isUnderstanding}
                aria-label={
                  isUnderstood
                    ? "Ask Nebula about this infrastructure"
                    : "Enter a domain"
                }
                aria-describedby={domainError ? "domain-error" : undefined}
                aria-invalid={domainError ? "true" : undefined}
                aria-busy={isUnderstanding}
                className={`
                  w-full px-4 py-3.5 sm:py-3.5 rounded-xl border text-[14px] sm:text-[15px] text-foreground font-mono
                  placeholder:text-muted-foreground/50 placeholder:font-mono bg-card
                  focus:outline-none focus:ring-2
                  transition-all duration-150 ease-out
                  shadow-[0_2px_8px_rgba(16,24,20,0.045)] dark:shadow-none
                  ${isUnderstanding
                    ? "opacity-50 cursor-default border-border focus:ring-0"
                    : domainError
                      ? "border-red-400 focus:ring-red-300/40 focus:border-red-400"
                      : "border-border/80 focus:ring-primary/20 focus:border-primary/40"
                  }
                `}
              />
            </div>

            <AnimatePresence>
              {!isUnderstood && (
                <motion.button
                  key="understand-btn"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  onClick={() => handleDomainSubmit()}
                  disabled={isUnderstanding || (!isActive || !localDomain.trim())}
                  aria-busy={isUnderstanding}
                  aria-label={
                    isUnderstanding
                      ? "Understanding in progress"
                      : "Understand domain"
                  }
                  className={`
                    sm:shrink-0 bg-primary text-primary-foreground
                    text-sm font-semibold px-5 py-3.5 rounded-xl
                    hover:opacity-95 active:scale-[0.99]
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                    transition-all duration-150 ease-out focus-ring
                    shadow-[0_2px_10px_rgba(26,86,219,0.22)]
                    flex items-center justify-center gap-2 cursor-pointer
                    ${!isValidCandidate && !isUnderstanding ? "opacity-75" : ""}
                  `}
                >
                  {isUnderstanding ? (
                    <span className="flex items-center justify-center gap-1.5">
                      Understanding
                      <span className="flex gap-[3px]" aria-hidden="true">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="size-[3px] rounded-full bg-white/70"
                            style={{
                              animation: `breathe 1.6s ease-in-out ${i * 0.22}s infinite`,
                            }}
                          />
                        ))}
                      </span>
                    </span>
                  ) : (
                    <>
                      <span>Understand</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Quick-Try Sample Domain Shortcuts */}
          <AnimatePresence>
            {isIdle && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.08 }}
                className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground/80"
              >
                <span className="font-medium">Try an example:</span>
                {CANONICAL_SAMPLE_DOMAINS.map((sample, idx) => (
                  <React.Fragment key={sample.domain}>
                    <button
                      type="button"
                      onClick={() => handleSampleSelect(sample.domain)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground/85 hover:text-foreground px-2 py-1 rounded-md bg-card/70 hover:bg-card border border-border/70 hover:border-border transition-all cursor-pointer focus-ring shadow-2xs"
                      title={`${sample.category}: ${sample.purpose}`}
                    >
                      <DomainFavicon domain={sample.domain} size="compact" className="w-3.5 h-3.5 rounded-xs" />
                      <span>{sample.domain}</span>
                    </button>
                    {idx < CANONICAL_SAMPLE_DOMAINS.length - 1 && (
                      <span className="text-muted-foreground/40 select-none">&bull;</span>
                    )}
                  </React.Fragment>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Calm Inline Error Display */}
          <AnimatePresence>
            {domainError && (
              <motion.p
                id="domain-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                className="mt-3 text-xs text-red-500 font-mono flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span>{domainError}</span>
              </motion.p>
            )}
          </AnimatePresence>

          {/* Reset under understood state */}
          <AnimatePresence>
            {isUnderstood && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                className="mt-3"
              >
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-2 py-1 mx-auto cursor-pointer"
                >
                  <RotateCcw className="size-3" strokeWidth={2} aria-hidden="true" />
                  <span>Understand a different domain</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zone D: Quiet Context & Zone E: Product Signature (Visible in IDLE) */}
          {isIdle && (
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-10 sm:mt-12 space-y-3"
            >
              {/* Zone D: Quiet Context */}
              <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
                Current intelligence &bull; No account required
              </p>

              {/* Zone E: Product Signature */}
              <p className="text-xs font-mono text-muted-foreground/60 tracking-wide">
                Intelligence before data &bull; Context before details &bull; Summary before evidence
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
