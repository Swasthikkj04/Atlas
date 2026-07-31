import React, { useState, useEffect, useRef } from 'react';
import type { GXState } from '../../types/gx';
import { useUnderstandingJob } from '../../hooks/useUnderstandingJob';
import { GlobalHeader } from './GlobalHeader';
import { IntentPrompt } from './IntentPrompt';
import { SynthesisStream } from './SynthesisStream';
import { InfrastructureBrief } from './InfrastructureBrief';
import { HighlightStrip } from './HighlightStrip';
import { FindingsList } from './FindingsList';
import { ContinuityDock } from './ContinuityDock';
import { BackgroundAtmosphere } from './BackgroundAtmosphere';
import { NebulaHeroBrand } from './NebulaHeroBrand';

interface GuestWorkspaceProps {
  onBackToLanding?: () => void;
}

export const GuestWorkspace: React.FC<GuestWorkspaceProps> = ({
  onBackToLanding,
}) => {
  const [targetDomain, setTargetDomain] = useState<string>('');
  const [internalState, setInternalState] = useState<GXState>('IDLE');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [sequencePhase, setSequencePhase] = useState<number>(0); // 0: Idle, 1: Transform, 2: Stream, 3: Moment, 4: Highlights, 5: Findings
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    status,
    brief,
    findings,
    errorMessage,
    submitTarget,
    resetJob,
  } = useUnderstandingJob();

  // Manage 0s - 20s Sequence Timeline Transitions
  useEffect(() => {
    if (status === 'RUNNING' || status === 'PENDING') {
      setInternalState('UNDERSTANDING');
      setSequencePhase(1); // Phase 1: Canvas Transformation (0s)

      const timer2 = setTimeout(() => {
        setSequencePhase(2); // Phase 2: Synthesis Stream (1.2s)
      }, 1200);

      return () => {
        clearTimeout(timer2);
      };
    } else if (status === 'COMPLETED') {
      // Phase 3: The Nebula Moment (7.5s)
      const timer3 = setTimeout(() => {
        setSequencePhase(3);
        setInternalState('INSIGHTS');
      }, 2300);

      // Phase 4: Structural Highlights Reveal (11.5s -> +4.0s)
      const timer4 = setTimeout(() => {
        setSequencePhase(4);
      }, 6300);

      // Phase 5: Findings & Evidence Unlock (16s -> +4.5s)
      const timer5 = setTimeout(() => {
        setSequencePhase(5);
      }, 10800);

      return () => {
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [status]);

  // Handle Domain Submission from IntentPrompt (State 0 -> State 1)
  const handleDomainSubmit = async (domain: string) => {
    setTargetDomain(domain);
    setInternalState('UNDERSTANDING');
    setSequencePhase(1);
    await submitTarget(domain);
  };

  // Reset State to IDLE
  const handleReset = () => {
    resetJob();
    setSequencePhase(0);
    setInternalState('IDLE');
  };

  // Scroll listener for State 2 -> State 3 (SCROLL_BASE)
  useEffect(() => {
    if (internalState !== 'INSIGHTS') return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 120
      ) {
        setInternalState('CONTINUITY');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [internalState]);

  const isIdle = internalState === 'IDLE';

  return (
    <div
      ref={containerRef}
      className="gx-workspace-root"
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background Engineering Atmosphere Layer (Dims to 0.04 during active sequence) */}
      <BackgroundAtmosphere isFocused={isInputFocused || sequencePhase > 0} />

      {/* CMP-01: Global Workspace Header */}
      <GlobalHeader
        targetDomain={targetDomain}
        status={status}
        onReset={onBackToLanding || handleReset}
      />

      {/* Main Single-Canvas Column */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '896px',
          margin: '0 auto',
          padding: isIdle ? '0 1.5rem 4rem 1.5rem' : '3rem 1.5rem 7rem 1.5rem', // 16px expanded padding
          boxSizing: 'border-box',
          transition: 'padding 800ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* STATE 0: IDLE WORKSPACE HERO STACK */}
        {isIdle && (
          <div
            style={{
              paddingTop: '28vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 800ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Centered Hero Branding Component */}
            <NebulaHeroBrand compact={false} />

            {/* Contextual Intent Headline */}
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: '#0F172A',
                marginTop: '0.5rem',
                marginBottom: '1.75rem',
                lineHeight: 1.25,
              }}
            >
              What are you trying to understand today?
            </h1>

            {/* Understanding Composer Input Bar */}
            <IntentPrompt
              onSubmit={handleDomainSubmit}
              isSubmitting={false}
              compact={false}
              initialValue={targetDomain}
              onFocusChange={setIsInputFocused}
            />
          </div>
        )}

        {/* PHASE 2: NATURAL SYNTHESIS STREAM */}
        {(sequencePhase === 1 || sequencePhase === 2) && status !== 'FAILED' && (
          <div style={{ paddingTop: '2rem' }}>
            <IntentPrompt
              onSubmit={handleDomainSubmit}
              isSubmitting={true}
              compact={true}
              initialValue={targetDomain}
              onFocusChange={setIsInputFocused}
            />

            <SynthesisStream
              targetDomain={targetDomain}
              isPolling={status === 'RUNNING' || status === 'PENDING'}
            />
          </div>
        )}

        {/* ERROR STATE CONTAINER */}
        {status === 'FAILED' && (
          <div
            style={{
              maxWidth: '640px',
              margin: '3rem auto 0 auto',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 24px rgba(220, 38, 38, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: '#DC2626',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  flexShrink: 0,
                  marginTop: '0.1rem',
                }}
              >
                [!]
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3
                  style={{
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    margin: 0,
                  }}
                >
                  Unable to establish infrastructure understanding for {targetDomain || 'target'}
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#475569',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {errorMessage ||
                    'The target host could not be reached via standard edge ingress routes (DNS resolution failed or host connection timed out).'}
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={handleReset}
                    style={{
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0F172A')}
                  >
                    Re-enter Domain Target
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3, 4 & 5: THE NEBULA MOMENT, HIGHLIGHTS & FINDINGS */}
        {sequencePhase >= 3 && brief && findings && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Phase 3: The Executive Statement Block */}
            <InfrastructureBrief brief={brief} targetDomain={targetDomain} />

            {/* Phase 4: Structural Highlights Reveal */}
            {sequencePhase >= 4 && (
              <HighlightStrip highlights={brief.highlights} />
            )}

            {/* Phase 5: Findings & Lineage Evidence Reveal */}
            {sequencePhase >= 5 && (
              <FindingsList findings={findings.findings} />
            )}
          </div>
        )}

        {/* CMP-08: ContinuityDock (State 3 / Scroll Baseline) */}
        {internalState === 'CONTINUITY' && (
          <ContinuityDock
            onCreateWorkspace={() => setShowAuthModal(true)}
          />
        )}
      </main>

      {/* Registration Auth Modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '2.5rem 2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                margin: '0 auto 1.25rem auto',
              }}
            >
              ⚡
            </div>
            <h3
              style={{
                fontSize: '1.375rem',
                fontWeight: 750,
                color: '#0F172A',
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              Save Your Workspace
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#475569',
                lineHeight: 1.5,
                margin: '0 0 1.75rem 0',
              }}
            >
              Create an account to persist snapshots for <strong>{targetDomain}</strong>, receive automated drift alerts, and export architectural briefs.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Workspace created for target ${targetDomain}!`);
                setShowAuthModal(false);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <input
                type="email"
                required
                placeholder="work@company.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue with Email
              </button>
            </form>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                marginTop: '1.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

GuestWorkspace.displayName = 'GuestWorkspace';
