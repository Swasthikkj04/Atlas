import React, { useState, useEffect, useRef } from 'react';

interface IntentPromptProps {
  onSubmit: (target: string) => void;
  isSubmitting?: boolean;
  compact?: boolean;
  initialValue?: string;
  onFocusChange?: (focused: boolean) => void;
}

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const SUGGESTED_DOMAINS = ['github.com', 'api.stripe.com', 'linear.app'];

export const IntentPrompt: React.FC<IntentPromptProps> = ({
  onSubmit,
  isSubmitting = false,
  compact = false,
  initialValue = '',
  onFocusChange,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (!compact && inputRef.current) {
      inputRef.current.focus();
    }
  }, [compact]);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocusChange) onFocusChange(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onFocusChange) onFocusChange(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setValidationError('Please enter a target domain or URL.');
      return;
    }

    if (!DOMAIN_REGEX.test(trimmed)) {
      setValidationError('Please enter a valid domain (e.g. github.com)');
      return;
    }

    setValidationError(null);
    onSubmit(trimmed);
  };

  const handleDomainClick = (domain: string) => {
    setInputValue(domain);
    setValidationError(null);
    onSubmit(domain);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: compact ? '768px' : '640px',
        margin: '0 auto',
        transition: 'all 380ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Understanding Composer Container (Height 56px, Radius 12px) */}
      <form
        onSubmit={handleSubmit}
        style={{
          height: compact ? '48px' : '56px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: validationError
            ? '1.5px solid #EF4444'
            : isFocused
            ? '1px solid #2563EB'
            : '1px solid #E2E8F0',
          borderRadius: '12px',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(37, 99, 235, 0.12), 0px 4px 24px rgba(15, 23, 42, 0.04)'
            : '0px 4px 24px rgba(15, 23, 42, 0.04)',
          padding: '0 8px 0 16px',
          transition: 'all 200ms ease',
          boxSizing: 'border-box',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (validationError) setValidationError(null);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Enter domain or URL (e.g. github.com)"
          disabled={isSubmitting}
          aria-invalid={!!validationError}
          aria-describedby={
            validationError
              ? 'domain-error-msg target-suggestions-hint'
              : 'target-suggestions-hint'
          }
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            fontWeight: 400,
            color: '#0F172A',
            backgroundColor: 'transparent',
            fontFamily: 'Inter, sans-serif',
          }}
        />

        {/* 40px x 40px Square CTA Button (8px inset) */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Submit Target Domain"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            opacity: isSubmitting ? 0.7 : 1,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#1E293B';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#0F172A';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.transform = 'translateX(0)';
            }
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'transform 150ms ease' }}
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </form>

      {/* Validation Error Message */}
      {validationError && (
        <div
          id="domain-error-msg"
          style={{
            color: '#DC2626',
            fontSize: '0.8125rem',
            marginTop: '0.5rem',
            marginLeft: '0.5rem',
            fontWeight: 500,
          }}
        >
          {validationError}
        </div>
      )}

      {/* Suggested Targets Line (16px below composer) */}
      {!compact && !isSubmitting && (
        <div
          id="target-suggestions-hint"
          style={{
            marginTop: '16px',
            fontSize: '0.75rem',
            color: '#94A3B8',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            flexWrap: 'wrap',
          }}
        >
          <span>e.g.,</span>
          {SUGGESTED_DOMAINS.map((domain, index) => (
            <React.Fragment key={domain}>
              <button
                type="button"
                onClick={() => handleDomainClick(domain)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.75rem',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  transition: 'color 150ms ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                {domain}
              </button>
              {index < SUGGESTED_DOMAINS.length - 1 && (
                <span style={{ color: '#CBD5E1' }}>•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

IntentPrompt.displayName = 'IntentPrompt';
