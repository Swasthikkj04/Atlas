import React, { useState } from 'react';
import type { Finding } from '../../types/gx';
import { EvidencePanel } from './EvidencePanel';

interface FindingsListProps {
  findings: Finding[];
}

const IMPACT_STYLES: Record<
  Finding['impact'],
  { bg: string; color: string; border: string }
> = {
  HIGH: { bg: '#FEF2F2', color: '#B91C1C', border: '#FCA5A5' },
  MEDIUM: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  LOW: { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
  POSITIVE: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
};

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleFinding = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFinding(id);
    }
  };

  if (!findings || findings.length === 0) return null;

  // Group findings by category
  const grouped = findings.reduce<Record<string, Finding[]>>((acc, item) => {
    const cat = item.category || 'General Observations';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <section
      style={{
        width: '100%',
        maxWidth: '768px',
        margin: '2rem auto 0 auto',
        boxSizing: 'border-box',
        animation: 'fadeInUp 260ms cubic-bezier(0.16, 1, 0.3, 1) 320ms forwards',
        opacity: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: '#0F172A',
            margin: 0,
          }}
        >
          Categorized Findings & Evidence
        </h3>
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
          {findings.length} Structural Observations
        </span>
      </div>

      {/* Grouped Category Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#64748B',
                paddingLeft: '0.25rem',
              }}
            >
              {category}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((finding) => {
                const isExpanded = expandedIds.has(finding.id);
                const impactStyle = IMPACT_STYLES[finding.impact] || IMPACT_STYLES.LOW;

                return (
                  <div
                    key={finding.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.03)',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Finding Row Button */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleFinding(finding.id)}
                      onKeyDown={(e) => handleKeyDown(e, finding.id)}
                      style={{
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        cursor: 'pointer',
                        outline: 'none',
                        userSelect: 'none',
                        backgroundColor: isExpanded ? '#FAFBFD' : '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.875rem',
                          flex: 1,
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: impactStyle.bg,
                            color: impactStyle.color,
                            border: `1px solid ${impactStyle.border}`,
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          {finding.impact}
                        </span>
                        <span
                          style={{
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            color: '#0F172A',
                            lineHeight: 1.4,
                          }}
                        >
                          {finding.headline}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#94A3B8',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms ease',
                        }}
                      >
                        ▼
                      </div>
                    </div>

                    {/* Inline Traceable Evidence Panel */}
                    <EvidencePanel
                      facts={finding.facts}
                      rawArtifacts={finding.raw_artifacts}
                      isExpanded={isExpanded}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

FindingsList.displayName = 'FindingsList';
