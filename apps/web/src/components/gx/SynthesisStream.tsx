import React, { useState, useEffect } from 'react';

interface SynthesisStreamProps {
  targetDomain?: string;
  isPolling?: boolean;
}

const STREAM_STEPS = [
  { time: 1200, text: 'Observing public infrastructure' },
  { time: 3200, text: 'Building infrastructure relationships' },
  { time: 5200, text: 'Synthesizing executive understanding' },
];

export const SynthesisStream: React.FC<SynthesisStreamProps> = ({
  targetDomain,
  isPolling = true,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  useEffect(() => {
    if (!isPolling) return;

    const timer1 = setTimeout(() => setActiveStepIndex(1), 3200);
    const timer2 = setTimeout(() => setActiveStepIndex(2), 5200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isPolling]);

  return (
    <div
      aria-live="polite"
      aria-busy={isPolling}
      style={{
        width: '100%',
        maxWidth: '480px',
        margin: '4rem auto 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
      }}
    >
      {/* Stream Target Title */}
      <div
        style={{
          width: '100%',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 500,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          Understanding {targetDomain || 'infrastructure'}
        </h2>
      </div>

      {/* 3-Step Stream Lines */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          width: '100%',
        }}
      >
        {STREAM_STEPS.map((step, idx) => {
          const isVisible = idx <= activeStepIndex;
          if (!isVisible) return null;

          const isCurrent = idx === activeStepIndex && isPolling;
          const isComplete = idx < activeStepIndex;

          return (
            <div
              key={step.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: isCurrent ? 500 : 400,
                color: isCurrent ? '#0F172A' : '#94A3B8',
                animation: 'fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                transition: 'color 200ms ease',
              }}
            >
              {isComplete ? (
                <span
                  style={{
                    color: '#94A3B8',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    width: '16px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
              ) : (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#2563EB',
                    display: 'inline-block',
                    animation: 'pulse 2.0s infinite ease-in-out',
                    margin: '0 4px',
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ lineHeight: 1.5 }}>{step.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

SynthesisStream.displayName = 'SynthesisStream';
