import React from 'react';

interface Principle {
  id: string;
  title: string;
  statement: string;
}

const PRINCIPLES: Principle[] = [
  {
    id: 'memory',
    title: 'Infrastructure Memory',
    statement:
      'Systems must be understood continuously across time. Nebula maintains deep temporal baselines so state drift is evaluated against months of architectural evolution, not point-in-time noise.',
  },
  {
    id: 'evidence',
    title: 'Evidence Over Assertion',
    statement:
      'Unverifiable conclusions are indistinguishable from noise. Every relationship, dependency link, and causal candidate in Nebula is explicitly auditable back to raw telemetry.',
  },
  {
    id: 'judgment',
    title: 'Preservation of Human Judgment',
    statement:
      'Intelligence illuminates context; engineers retain ultimate authority. Nebula synthesizes complex state graphs so teams act with speed and absolute clarity.',
  },
  {
    id: 'comprehension',
    title: 'Systemic Comprehension',
    statement:
      'Alert fatigue is a symptom of fragmented understanding. By structuring raw telemetry into a unified causal graph, Nebula transforms thousands of alerts into a single cohesive narrative.',
  },
];

const FOOTER_LINKS = [
  { label: 'Documentation', href: '#docs' },
  { label: 'API Reference', href: '#api' },
  { label: 'System Status', href: '#status' },
  { label: 'Contact', href: '#contact' },
  { label: 'GitHub', href: 'https://github.com', external: true },
];

export const FinalManifestoAndFooter: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#050608', color: '#f8fafc' }}>
      {/* =========================================================================
          1. PRINCIPLES: Editorial Manifesto Section
          ========================================================================= */}
      <section
        style={{
          padding: '10rem 2rem 6rem 2rem',
          maxWidth: '1100px',
          margin: '0 auto',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        {/* Section Lead-in */}
        <div style={{ marginBottom: '6rem' }}>
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
            [ Engineering Discipline ]
          </span>

          <h2
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              marginTop: '1.25rem',
              color: '#ffffff',
              maxWidth: '780px',
            }}
          >
            Principles that govern every conclusion.
          </h2>
        </div>

        {/* Timeless Principles (No Numbers, Generous Vertical Rhythm) */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {PRINCIPLES.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '4.5rem 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: '1fr 1.25fr',
                gap: '4rem',
                alignItems: 'baseline',
              }}
            >
              {/* Prominent Principle Title */}
              <h3
                style={{
                  fontSize: 'clamp(1.75rem, 2.8vw, 2.25rem)',
                  fontWeight: 750,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {p.title}
              </h3>

              {/* Concise Supporting Statement */}
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.65,
                  color: '#A8B4CC',
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {p.statement}
              </p>
            </div>
          ))}
        </div>

        {/* =========================================================================
            2. CLOSING STATEMENT: Timeless Narrative Conclusion
            ========================================================================= */}
        <div
          style={{
            marginTop: '10rem',
            marginBottom: '6rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(1.5rem, 3.2vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#f8fafc',
              lineHeight: 1.25,
              maxWidth: '820px',
              margin: '0 auto',
            }}
          >
            Complex infrastructure deserves clear understanding.
          </p>

          {/* Final CTA Bridge */}
          <div style={{ marginTop: '3.5rem' }}>
            <a
              href="#launch"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: '#ffffff',
                color: '#050608',
                padding: '0.95rem 2.25rem',
                borderRadius: '9999px',
                fontSize: '0.9375rem',
                fontWeight: 650,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                boxShadow: '0 12px 30px -8px rgba(255, 255, 255, 0.15)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span>Enter Nebula</span>
              <span style={{ fontSize: '0.85rem' }}>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FOOTER: Minimal & Utility-First for Engineers
          ========================================================================= */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4rem 2rem 5rem 2rem',
          maxWidth: '1100px',
          margin: '0 auto',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
          }}
        >
          {/* Brand Wordmark Anchor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Nebula
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              // Infrastructure Intelligence Platform
            </span>
          </div>

          {/* Engineer Utility Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2.25rem',
            }}
          >
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                style={{
                  fontSize: '0.8125rem',
                  color: '#E2E8F0',
                  textDecoration: 'none',
                  transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#E2E8F0')}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Systemic Copyright / Spec Line */}
        <div
          style={{
            marginTop: '3.5rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          <span>© {new Date().getFullYear()} Nebula Systems Inc. All rights reserved.</span>
          <span>AUTONOMY THROUGH COMPREHENSION</span>
        </div>
      </footer>
    </div>
  );
};

FinalManifestoAndFooter.displayName = 'FinalManifestoAndFooter';
