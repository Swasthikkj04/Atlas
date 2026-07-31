import React from 'react';

interface NebulaHeroBrandProps {
  compact?: boolean;
}

export const NebulaHeroBrand: React.FC<NebulaHeroBrandProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
        <div
          style={{
            position: 'relative',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(255, 138, 0, 0.5)',
              borderRadius: '2px',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#FF8A00',
              boxShadow: '0 0 6px rgba(255, 138, 0, 0.6)',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#0F172A',
          }}
        >
          Nebula
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* Nebula Reticle Node Indicator */}
      <div
        style={{
          position: 'relative',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Corner Reticle Brackets */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid rgba(255, 138, 0, 0.4)',
            borderRadius: '2px',
          }}
        />

        {/* Soft Blurred Glow Core */}
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #FF5C00, #FFA800)',
            filter: 'blur(3px)',
            opacity: 0.8,
            animation: 'pulse 3s infinite ease-in-out',
          }}
        />

        {/* Sharp Core Dot */}
        <div
          style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#FF8A00',
            boxShadow: '0 0 8px rgba(255, 138, 0, 0.6)',
          }}
        />
      </div>

      {/* Nebula Title Wordmark */}
      <h1
        style={{
          fontSize: 'clamp(2.25rem, 5vw, 3rem)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: '#0F172A',
          margin: 0,
          lineHeight: 1,
        }}
      >
        Nebula
      </h1>
    </div>
  );
};

NebulaHeroBrand.displayName = 'NebulaHeroBrand';
