import React, { useState } from 'react';

interface Principle {
  id: string;
  number: string;
  title: string;
  thesis: string;
  elaboration: string;
}

const PRINCIPLES: Principle[] = [
  {
    id: 'memory',
    number: '01',
    title: 'Infrastructure Memory',
    thesis: 'Systems must be understood across time, not through isolated snapshots.',
    elaboration:
      'Transient anomalies are rarely self-contained. Nebula maintains a continuous historical baseline, evaluating current state drift against months of architectural evolution rather than reacting to point-in-time spikes.',
  },
  {
    id: 'evidence',
    number: '02',
    title: 'Evidence Over Assertion',
    thesis: 'Unverifiable conclusions are indistinguishable from noise.',
    elaboration:
      'Nebula never outputs statistical guesses or opaque confidence scores. Every relationship, topology link, and causal node is backed by explicit, auditable telemetry traces.',
  },
  {
    id: 'judgment',
    number: '03',
    title: 'Preservation of Human Judgment',
    thesis: 'Intelligence illuminates context; engineers retain authority.',
    elaboration:
      'Automated remediation without human comprehension creates brittle systems. Nebula synthesizes complex state graphs so engineers can make decisive, informed choices with complete clarity.',
  },
  {
    id: 'comprehension',
    number: '04',
    title: 'Systemic Comprehension',
    thesis: 'Noise reduction is a symptom of understanding, not a filter setting.',
    elaboration:
      'Instead of suppressing symptoms or tuning arbitrary thresholds, Nebula structures raw signals into a unified causal graph—transforming thousands of disparate alerts into a clear structural narrative.',
  },
];

export const PrinciplesManifesto: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section
      id="why-argonion"
      style={{
        backgroundColor: '#08090c',
        color: '#f8fafc',
        padding: '10rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Section Header Anchor */}
        <div style={{ marginBottom: '5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            }}
          >
            [ Governance & Trust ]
          </span>

          <h2
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              marginTop: '1.25rem',
              maxWidth: '820px',
              color: '#ffffff',
            }}
          >
            Designed around engineering principles, not marketing claims.
          </h2>
        </div>

        {/* Editorial Manifesto Stack */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
          {PRINCIPLES.map((p) => {
            const isHovered = hoveredId === p.id;
            return (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  padding: '3.5rem 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 1.3fr',
                  gap: '3rem',
                  alignItems: 'baseline',
                  transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: isHovered
                    ? 'rgba(255, 255, 255, 0.015)'
                    : 'transparent',
                }}
              >
                {/* Index Number */}
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    color: isHovered ? '#38bdf8' : '#94a3b8',
                    transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {p.number}
                </span>

                {/* Principle Title & Thesis */}
                <div>
                  <h3
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#ffffff',
                      margin: 0,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      color: '#A8B4CC',
                      marginTop: '1.5rem',
                      fontWeight: 450,
                      maxWidth: '380px',
                    }}
                  >
                    {p.thesis}
                  </p>
                </div>

                {/* Technical Elaboration */}
                <div>
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      lineHeight: 1.65,
                      color: '#94a3b8',
                      margin: 0,
                      fontWeight: 400,
                    }}
                  >
                    {p.elaboration}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Structural Footer Statement */}
        <div
          style={{
            marginTop: '6rem',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8125rem',
            color: '#64748b',
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          }}
        >
          <span>ENGINEERING DISCIPLINE // NON-NEGOTIABLE</span>
          <span>NEBULA CORE SPECIFICATION</span>
        </div>
      </div>
    </section>
  );
};

PrinciplesManifesto.displayName = 'PrinciplesManifesto';
