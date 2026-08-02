import { motion, AnimatePresence } from "motion/react";
import { Globe, RotateCcw, AlertCircle } from "lucide-react";
import type { GuestPhase } from "../../types";
import { useHeroForm } from "./useHeroForm";
import { ease } from "../common";
import { LivingSignature } from "./LivingSignature";
import { BackgroundConstellation } from "../../../../components/branding";

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
  const {
    inputValue,
    domainError,
    inputPlaceholder,
    ariaLabel,
    isUnderstanding,
    isUnderstood,
    heroExpanded,
    handleChange,
    handleSubmit,
    handleKeyDown,
    handleReset,
  } = useHeroForm({
    phase,
    displayDomain,
    onSubmit,
    onReset,
    inputRef,
  });

  return (
    <section
      aria-label="Understand your infrastructure"
      className={`relative min-h-[60vh] lg:min-h-[66vh] flex flex-col justify-center transition-all duration-[760ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        heroExpanded
          ? "pt-[148px] sm:pt-[176px] lg:pt-[208px] pb-[108px] sm:pb-[140px] lg:pb-[172px]"
          : "pt-[84px]  sm:pt-[90px]  pb-12  sm:pb-14"
      }`}
    >
      {/* BX-010 — Background Intelligence */}
      <BackgroundConstellation phase={phase} sections={sections} />

      <div className="relative max-w-[640px] sm:max-w-[720px] mx-auto px-5 sm:px-8 text-center">

        {/* ── HeroTitle + HeroDescription ─────────────────────────────────── */}
        <AnimatePresence>
          {phase === "IDLE" && (
            <motion.div
              key="hero-copy"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease }}
            >
              <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase mb-9 sm:mb-10">
                Nebula · Infrastructure Intelligence
              </p>

              <h1 className="font-display font-normal text-[3.125rem] sm:text-[4rem] lg:text-[4.375rem] leading-[1.06] tracking-[-0.03em] text-foreground mb-6 sm:mb-7">
                Understand your
                <br />
                <em className="italic text-foreground/60">infrastructure.</em>
              </h1>

              <p className="text-[0.9375rem] sm:text-[1.0625rem] text-muted-foreground leading-[1.8] max-w-[440px] mx-auto mb-14 sm:mb-16 lg:mb-20">
                Enter a domain. Within minutes, Nebula returns a clear engineering
                assessment — written for humans, not dashboards.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DomainInput + UnderstandButton ─────────────────────────────── */}
        <motion.div layout="position" className="max-w-[520px] sm:max-w-[600px] mx-auto">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">

            {/* Input */}
            <div className="relative flex-1">
              <Globe
                className={`absolute left-4 top-1/2 -translate-y-1/2 size-[15px] pointer-events-none transition-colors duration-300 ${
                  isUnderstanding ? "text-muted-foreground/35" : "text-muted-foreground"
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
                aria-label={ariaLabel}
                aria-describedby={domainError ? "domain-error" : undefined}
                aria-invalid={domainError ? "true" : undefined}
                aria-busy={isUnderstanding}
                className={`
                  w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-xl border text-[13.5px] sm:text-[14px] text-foreground
                  placeholder:text-muted-foreground/40 bg-card
                  focus:outline-none focus:ring-2
                  transition-all duration-300
                  shadow-[0_1px_2px_rgba(0,0,0,0.04)]
                  ${isUnderstanding
                    ? "opacity-45 cursor-default border-border focus:ring-0"
                    : domainError
                      ? "border-red-300/80 focus:ring-red-200/50 focus:border-red-300"
                      : "border-border focus:ring-primary/12 focus:border-primary/25"
                  }
                `}
              />
            </div>

            {/* Submit button — hidden when understood */}
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
                    text-[13.5px] sm:text-[14px] font-medium px-5.5 py-3.5 sm:py-4 rounded-xl
                    hover:opacity-90 active:opacity-70
                    disabled:opacity-35 disabled:cursor-default
                    transition-all focus-ring
                    shadow-[0_1px_3px_rgba(26,86,219,0.22)]
                    hover:shadow-[0_2px_6px_rgba(26,86,219,0.28)]
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

          {/* Inline validation error */}
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

          {/* Reset — visible when understood */}
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

          {/* BX-002 + BX-003 — Living Signature */}
          <LivingSignature phase={phase} />
        </motion.div>
      </div>
    </section>
  );
}
