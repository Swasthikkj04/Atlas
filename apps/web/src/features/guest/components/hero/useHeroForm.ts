import { useState, useCallback } from "react";
import type { GuestPhase } from "../../types";
import { isValidDomain, normalizeDomain } from "../../domain/validation";
import { emit } from "../../analytics";

export interface UseHeroFormOptions {
  phase:         GuestPhase;
  displayDomain: string;
  onSubmit:      (domain: string) => void;
  onReset:       () => void;
  inputRef:      React.RefObject<HTMLInputElement>;
}

export function useHeroForm({
  phase,
  displayDomain,
  onSubmit,
  onReset,
  inputRef,
}: UseHeroFormOptions) {
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

  const ariaLabel = isUnderstood
    ? "Ask Nebula about this infrastructure"
    : "Domain name to understand";

  const clearError = useCallback(() => {
    setDomainError(null);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUnderstood) {
      setSearchQuery(e.target.value);
    } else if (isActive) {
      setLocalDomain(e.target.value);
      if (domainError && e.target.value.trim()) {
        setDomainError(null);
      }
    }
  };

  const handleSubmit = useCallback(() => {
    const normalized = normalizeDomain(localDomain);

    if (!normalized) {
      const msg = "Enter a domain to understand, for example stripe.com";
      setDomainError(msg);
      emit("VALIDATION_FAILED", { domain: localDomain, reason: "EMPTY" });
      inputRef.current?.focus();
      return;
    }

    if (!isValidDomain(normalized)) {
      const msg = "Enter a valid public domain, for example stripe.com";
      setDomainError(msg);
      emit("VALIDATION_FAILED", { domain: localDomain, reason: "INVALID_FORMAT" });
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

  return {
    value:            inputValue,
    inputValue,
    error:            domainError,
    domainError,
    placeholder:      inputPlaceholder,
    inputPlaceholder,
    ariaLabel,
    disabled:         isUnderstanding,
    readOnly:         isUnderstanding,
    isActive,
    isUnderstanding,
    isUnderstood,
    heroExpanded,
    onChange:         handleChange,
    handleChange,
    onKeyDown:        handleKeyDown,
    handleKeyDown,
    submit:           handleSubmit,
    handleSubmit,
    reset:            handleReset,
    handleReset,
    clearError,
  };
}
