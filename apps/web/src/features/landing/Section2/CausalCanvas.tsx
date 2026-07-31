import React, { useState } from 'react';

interface Stage {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  evidenceCount: number;
  details: string[];
}

const STAGES: Stage[] = [
  {
    id: 'signals',
    number: '01',
    title: 'Observed Signals',
    subtitle: 'Telemetry Anomaly Clustering',
    evidenceCount: 14,
    details: [
      'HTTP 502 rate deviation (+12.4% above baseline)',
      'db-pool-main connection timeout accumulation',
      'Ingress controller queue depth saturation',
    ],
  },
  {
    id: 'relationships',
    number: '02',
    title: 'Structural Relationships',
    subtitle: 'Topological Edge Mapping',
    evidenceCount: 8,
    details: [
      'Service dependency: api-gateway → auth-v2 → db-pool-main',
      'Upstream propagation latency: +140ms on auth-v2 node',
      'Shared memory cache pool collision detected',
    ],
  },
  {
    id: 'history',
    number: '03',
    title: 'Historical Context',
    subtitle: 'State Drift & Change Logs',
    evidenceCount: 3,
    details: [
      'Deployment commit #a8f19c deployed 14m prior',
      'Environment variable connection_limit modified',
      'Historical match: 94% structural parity with incident #INC-802',
    ],
  },
  {
    id: 'reasoning',
    number: '04',
    title: 'Formulated Explanation',
    subtitle: 'Causal Chain Synthesis',
    evidenceCount: 1,
    details: [
      'State change in auth-v2 reduced max db connection pool',
      'Cascading queue buildup triggered HTTP 502 at ingress layer',
      'System hypothesis generated for engineer verification',
    ],
  },
];

export const CausalCanvas: React.FC = () => {
  const [activeStage, setActiveStage] = useState<string>('signals');

  return (
    <section
      id="nebula"
      style={{
        backgroundColor: '#0b0c10',
        color: '#f8fafc',
        padding: '8rem 2rem',
        borderTop: '1px solid #1e293b',
        borderBottom: '1px solid #1e293b',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: '5rem',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Manifest copy */}
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#38bdf8',
              fontFamily: 'monospace',
            }}
          >
            [ Inside Nebula Engine ]
          </span>

          <h2
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginTop: '1rem',
              color: '#ffffff',
            }}
          >
            Trust built through transparency, not simulated certainty.
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: '#A8B4CC',
              marginTop: '1.5rem',
              maxWidth: '520px',
            }}
          >
            Nebula doesn’t issue opaque diagnoses or fake confidence scores.
            Instead, it surfaces the underlying telemetry signals, maps their topological relationships, and presents an auditable chain of evidence.
          </p>

          <div
            style={{
              marginTop: '2.5rem',
              paddingLeft: '1.25rem',
              borderLeft: '2px solid #334155',
            }}
          >
            <p
              style={{
                fontSize: '0.9375rem',
                color: '#E2E8F0',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              "We provide the evidence graph and the reasoning framework. You retain the judgment."
            </p>
          </div>
        </div>

        {/* Right Column: Conceptual Causal Framework UI */}
        <div
          style={{
            backgroundColor: '#111318',
            border: '1px solid #222734',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Interface Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '1.25rem',
              marginBottom: '1.75rem',
              borderBottom: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                }}
              />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  color: '#A8B4CC',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Causal Pipeline // Live Reasoning Frame
              </span>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}
            >
              Mode: Auditable
            </span>
          </div>

          {/* Pipeline Stage Selectors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            {STAGES.map((s) => {
              const isActive = activeStage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(s.id)}
                  style={{
                    backgroundColor: isActive ? '#1e293b' : 'transparent',
                    border: `1px solid ${isActive ? '#3b82f6' : '#1e293b'}`,
                    borderRadius: '6px',
                    padding: '0.6rem 0.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'monospace',
                      color: isActive ? '#60a5fa' : '#94a3b8',
                    }}
                  >
                    {s.number}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isActive ? '#ffffff' : '#A8B4CC',
                      marginTop: '0.2rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Details Panel */}
          {STAGES.filter((s) => s.id === activeStage).map((stage) => (
            <div
              key={stage.id}
              style={{
                backgroundColor: '#090a0f',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#f1f5f9',
                    }}
                  >
                    {stage.title}
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {stage.subtitle}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                  }}
                >
                  {stage.evidenceCount} Nodes Mapped
                </span>
              </div>

              {/* Node Detail List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                {stage.details.map((detail, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      fontSize: '0.84rem',
                      color: '#E2E8F0',
                      fontFamily: 'monospace',
                      backgroundColor: '#111318',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '4px',
                      borderLeft: '2px solid #3b82f6',
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>→</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer Architecture Note */}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontFamily: 'monospace',
            }}
          >
            <span>Framework: Causal DAG Engine</span>
            <span>Zero Synthetic Assumptions</span>
          </div>
        </div>
      </div>
    </section>
  );
};

CausalCanvas.displayName = 'CausalCanvas';
