import React, { useState } from 'react';

interface ContinuityDockProps {
  onCreateWorkspace: () => void;
}

export const ContinuityDock: React.FC<ContinuityDockProps> = ({
  onCreateWorkspace,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="gx-continuity-dock"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 'calc(100% - 32px)',
        maxWidth: '640px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        boxSizing: 'border-box',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Persist this infrastructure model.
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.4 }}>
          Create a workspace to save this snapshot and receive change notifications.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <button
          onClick={() => setDismissed(true)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '0.4rem 0.6rem',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Dismiss
        </button>
        <button
          onClick={onCreateWorkspace}
          style={{
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.55rem 1.125rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
        >
          Create Workspace
        </button>
      </div>
    </div>
  );
};

ContinuityDock.displayName = 'ContinuityDock';
