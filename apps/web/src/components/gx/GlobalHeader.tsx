import React from 'react';
import { NebulaHeroBrand } from './NebulaHeroBrand';

interface GlobalHeaderProps {
  targetDomain?: string | null;
  status?: 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  onReset?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  targetDomain,
  status = 'IDLE',
  onReset,
}) => {
  const isIdle = status === 'IDLE';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        padding: '0 2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top Navigation Header: Parent Brand (Argonion) + Optional Workspace Shell Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}
      >
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}
        >
          <img
            src="/argonion-mark.svg"
            alt="Argonion"
            style={{ height: '16px', width: 'auto', display: 'block' }}
          />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#475569',
            }}
          >
            ARGONION
          </span>

          {/* Morph into Workspace Shell Breadcrumb on Active State */}
          {!isIdle && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginLeft: '0.25rem',
                animation: 'fadeInUp 0.25s ease-out forwards',
              }}
            >
              <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>/</span>
              <NebulaHeroBrand compact={true} />
            </div>
          )}
        </button>
      </div>

      {/* Center: Session Target & Status Indicator */}
      {!isIdle && targetDomain && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9999px',
            padding: '0.3rem 0.85rem',
            fontSize: '0.8125rem',
            color: '#0F172A',
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor:
                status === 'RUNNING' || status === 'PENDING'
                  ? '#2563EB'
                  : status === 'COMPLETED'
                  ? '#16A34A'
                  : status === 'FAILED'
                  ? '#DC2626'
                  : '#94A3B8',
              boxShadow:
                status === 'RUNNING'
                  ? '0 0 0 3px rgba(37, 99, 235, 0.2)'
                  : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          <span style={{ fontWeight: 600 }}>{targetDomain}</span>
          <span
            className="gx-header-status-text"
            style={{
              color: '#64748B',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            • {status}
          </span>
        </div>
      )}

      {/* Top-Right: [ Log in ] & Theme Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {!isIdle && onReset && (
          <button
            onClick={onReset}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #E2E8F0',
              color: '#475569',
              borderRadius: '6px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#94A3B8';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#475569';
            }}
          >
            New Analysis
          </button>
        )}
        <a
          href="#login"
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#475569',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
        >
          Log in
        </a>
        <div
          title="Theme (Light)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94A3B8',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </div>
      </div>
    </header>
  );
};

GlobalHeader.displayName = 'GlobalHeader';
