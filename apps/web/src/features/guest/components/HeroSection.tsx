import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, RotateCcw, AlertCircle } from "lucide-react";
import type { GuestPhase } from "../types";
import { isValidDomain, normalizeDomain, ease } from "../types";
import { LivingSignature } from "./LivingSignature";
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

  const isActive        = phase === "IDLE"    || phase === "ERROR";
  const isUnderstanding = phase === "UNDERSTANDING" || phase === "PAUSING" || phase === "VALIDATING";
  const isUnderstood    = phase === "UNDERSTOOD" || phase === "CONVERTED";
  const heroExpanded    = phase === "IDLE";

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

  const handleSubmit = useCallback(() => {
    const normalized = normalizeDomain(localDomain);

    if (!normalized) {
      const msg = "Enter a domain to understand, for example stripe.com";
      setDomainError(msg);
      inputRef.current?.focus();
      return;
    }

    if (!isValidDomain(normalized)) {
      const msg = "Enter a valid public domain, for example stripe.com";
      setDomainError(msg);
      inputRef.current?.focus();
      return;
    }

    setDomainError(null);
    setLocalDomain("");
    onSubmit(normalized);
  }, [localDomain, onSubmit, inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isActive) {
      handleSubmit();
    }
    if (e.key === "Escape" && domainError) {
      e.preventDefault();
      setDomainError(null);
    }
  };

  const handleReset = useCallback(() => {
    setLocalDomain("");
    setSearchQuery("");
    setDomainError(null);
    onReset();
  }, [onReset]);

  return (
    <section
      aria-label="Understand your infrastructure"
      className={`relative transition-all duration-[760ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        heroExpanded
          ? "pt-[156px] sm:pt-[176px] md:pt-[192px] pb-[96px] sm:pb-[112px]"
          : "pt-[84px]  sm:pt-[90px]  pb-12  sm:pb-14"
      }`}
    >
      <BackgroundConstellation phase={phase} sections={sections} />

      <div className="relative max-w-[640px] mx-auto px-5 sm:px-8 text-center">
        <AnimatePresence>
          {phase === "IDLE" && (
            <motion.div
              key="hero-copy"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease }}
            >
              <p className="text-[10.5px] font-semibold tracking-[0.28em] text-muted-foreground/75 uppercase mb-8">
                Nebula · Infrastructure Intelligence
              </p>

              <h1 className="font-display font-normal text-[3.125rem] sm:text-[4rem] md:text-[4.375rem] leading-[1.04] tracking-[-0.035em] text-foreground mb-6">
                Understand your
                <br />
                <em className="italic font-normal text-foreground/75">infrastructure.</em>
              </h1>

              <p className="text-[0.9375rem] sm:text-[1.0625rem] text-muted-foreground/90 leading-[1.8] max-w-[430px] mx-auto mb-12 sm:mb-14 font-normal">
                Enter a domain. Within minutes, Nebula returns a clear engineering
                assessment — written for humans, not dashboards.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout="position" className="max-w-[560px] mx-auto">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Globe
                className={`absolute left-4 top-1/2 -translate-y-1/2 size-[15px] pointer-events-none transition-colors duration-300 ${
                  isUnderstanding ? "text-muted-foreground/35" : "text-muted-foreground/60"
                }`}
                strokeWidth={1.5}
                aria-hidden="true"
              />
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
                    : "Domain name to understand"
                }
                aria-describedby={domainError ? "domain-error" : undefined}
                aria-invalid={domainError ? "true" : undefined}
                aria-busy={isUnderstanding}
                className={`
                  w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-xl border text-[14px] text-foreground
                  placeholder:text-muted-foreground/45 bg-card
                  focus:outline-none focus:ring-2
                  transition-all duration-300
                  shadow-[0_1px_3px_rgba(0,0,0,0.04)]
                  ${isUnderstanding
                    ? "opacity-45 cursor-default border-border focus:ring-0"
                    : domainError
                      ? "border-red-300/80 focus:ring-red-200/50 focus:border-red-300"
                      : "border-border focus:ring-primary/12 focus:border-primary/25"
                  }
                `}
              />
            </div>

            <AnimatePresence>
              {!isUnderstood && (
                <motion.button
                  key="understand-btn"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.22 }}
                  onClick={handleSubmit}
                  disabled={isUnderstanding}
                  aria-busy={isUnderstanding}
                  aria-label={
                    isUnderstanding
                      ? "Understanding in progress"
                      : "Understand this domain"
                  }
                  className="
                    sm:shrink-0 bg-primary text-primary-foreground
                    text-[14px] font-medium px-6.5 py-3.5 sm:py-4 rounded-xl
                    hover:opacity-90 active:opacity-70
                    disabled:opacity-35 disabled:cursor-default
                    transition-all focus-ring
                    shadow-[0_2px_8px_rgba(26,86,219,0.25)]
                    hover:shadow-[0_4px_12px_rgba(26,86,219,0.3)]
                  "
                >
                  {isUnderstanding ? (
                    <span className="flex items-center justify-center gap-1.5">
                      Understanding
                      <span className="flex gap-[3px]" aria-hidden="true">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="size-[3px] rounded-full bg-white/55"
                            style={{
                              animation: `breathe 1.6s ease-in-out ${i * 0.22}s infinite`,
                            }}
                          />
                        ))}
                      </span>
                    </span>
                  ) : (
                    "Understand Infrastructure"
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {domainError && (
              <motion.p
                id="domain-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="mt-2.5 text-[12px] text-red-500 flex items-center gap-1.5 text-left"
              >
                <AlertCircle className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                {domainError}
              </motion.p>
            )}
          </AnimatePresence>

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
                  className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground/45 hover:text-muted-foreground transition-colors focus-ring rounded mx-auto"
                >
                  <RotateCcw className="size-3" strokeWidth={2} aria-hidden="true" />
                  Understand a different domain
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <LivingSignature phase={phase} />
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
