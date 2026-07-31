import React from 'react';
import type { FindingFact } from '../../types/gx';

interface EvidencePanelProps {
  facts: FindingFact[];
  rawArtifacts: Record<string, any>;
  isExpanded: boolean;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  facts,
  rawArtifacts,
  isExpanded,
}) => {
  if (!isExpanded) return null;

  return (
    <div
      aria-expanded={isExpanded}
      style={{
        borderTop: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        animation: 'expandFade 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Monospaced Key-Value Structural Facts */}
      <div>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#64748B',
            marginBottom: '0.75rem',
          }}
        >
          Observed Protocol Evidence & Facts
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.625rem',
          }}
        >
          {facts.map((fact, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: '#94A3B8', marginRight: '0.5rem' }}>
                {fact.key}:
              </span>
              <span style={{ color: '#475569', fontWeight: 600 }}>
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Protocol Lineage JSON */}
      <div>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#64748B',
            marginBottom: '0.5rem',
          }}
        >
          Raw Ingress Artifacts
        </div>
        <pre
          style={{
            margin: 0,
            backgroundColor: '#0F172A',
            color: '#E2E8F0',
            padding: '0.875rem 1rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
            overflowX: 'auto',
            lineHeight: 1.5,
          }}
        >
          <code>{JSON.stringify(rawArtifacts, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
};

EvidencePanel.displayName = 'EvidencePanel';
