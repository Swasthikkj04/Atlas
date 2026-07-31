import React, { useState, useEffect } from 'react';
import type { SnapshotBriefResponse } from '../../types/gx';

interface InfrastructureBriefProps {
  brief: SnapshotBriefResponse;
  targetDomain: string;
}

export const InfrastructureBrief: React.FC<InfrastructureBriefProps> = ({
  brief,
  targetDomain,
}) => {
  const [showAnchorLine, setShowAnchorLine] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnchorLine(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      style={{
        width: '100%',
        maxWidth: '680px',
        margin: '3rem auto 0 auto',
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
        boxSizing: 'border-box',
        animation: 'fadeInUp 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Target Domain Context */}
      <div
        style={{
          fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
          fontSize: '0.875rem',
          color: '#64748B',
          marginBottom: '0.75rem',
          letterSpacing: '0.025em',
        }}
      >
        {targetDomain}
      </div>

      {/* Executive Statement Paragraph Block */}
      <p
        style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 1.875rem)',
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: '-0.02em',
          color: '#0F172A',
          margin: 0,
        }}
      >
        {brief.summary}
      </p>

      {/* Signature Closing Anchoring Phrase: "Here is what matters." */}
      {showAnchorLine && (
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 500,
            color: '#2563EB',
            marginTop: '1.5rem',
            animation: 'fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          Here is what matters.
        </div>
      )}
    </section>
  );
};

InfrastructureBrief.displayName = 'InfrastructureBrief';
