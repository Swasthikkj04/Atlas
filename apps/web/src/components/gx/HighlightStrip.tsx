import React from 'react';

interface HighlightStripProps {
  highlights: string[];
}

const CATEGORY_TITLES = ['INGRESS PATH', 'ARCHITECTURE', 'RECENT DELTA'];

export const HighlightStrip: React.FC<HighlightStripProps> = ({ highlights }) => {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '680px',
        margin: '2rem auto 0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        boxSizing: 'border-box',
        animation: 'fadeInUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {highlights.map((item, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '1rem',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            transition: 'border-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#64748B',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {CATEGORY_TITLES[idx] || `TAKEAWAY 0${idx + 1}`}
          </span>
          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.45,
              color: '#0F172A',
              fontWeight: 500,
              margin: 0,
            }}
          >
            {item}
          </p>
        </div>
      ))}
    </div>
  );
};

HighlightStrip.displayName = 'HighlightStrip';
