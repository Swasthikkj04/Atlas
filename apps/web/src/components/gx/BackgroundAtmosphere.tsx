import React from 'react';

interface BackgroundAtmosphereProps {
  isFocused?: boolean;
}

export const BackgroundAtmosphere: React.FC<BackgroundAtmosphereProps> = ({
  isFocused = false,
}) => {
  return (
    <div
      className="gx-atmosphere-root"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Depth Lighting Radial Glow at (50%, 30%) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(600px circle at 50% 30%, rgba(248, 250, 252, 0.85), transparent 100%)',
        }}
      />

      {/* 32px Topological Mesh Background */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isFocused ? 0.1 : 0.2,
          transition: 'opacity 300ms ease-out',
        }}
      >
        <defs>
          <pattern
            id="topo-mesh-32"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo-mesh-32)" />

        {/* Faint Constellation Connection Lines & Pulsing Nodes */}
        <g stroke="#94A3B8" strokeWidth="0.5" opacity="0.15">
          <line x1="20%" y1="25%" x2="35%" y2="30%" />
          <line x1="35%" y1="30%" x2="50%" y2="22%" />
          <line x1="50%" y1="22%" x2="65%" y2="28%" />
          <line x1="65%" y1="28%" x2="80%" y2="22%" />
          <line x1="35%" y1="30%" x2="45%" y2="48%" />
          <line x1="65%" y1="28%" x2="55%" y2="52%" />
        </g>

        {/* 6 Subtle Constellation Node Points with Low Frequency Pulse */}
        <g fill="#2563EB">
          <circle cx="20%" cy="25%" r="2" className="gx-node-pulse" style={{ animationDelay: '0s' }} />
          <circle cx="35%" cy="30%" r="2.5" className="gx-node-pulse" style={{ animationDelay: '0.8s' }} />
          <circle cx="50%" cy="22%" r="2" className="gx-node-pulse" style={{ animationDelay: '1.6s' }} />
          <circle cx="65%" cy="28%" r="2.5" className="gx-node-pulse" style={{ animationDelay: '2.4s' }} />
          <circle cx="80%" cy="22%" r="2" className="gx-node-pulse" style={{ animationDelay: '3.2s' }} />
          <circle cx="45%" cy="48%" r="2" className="gx-node-pulse" style={{ animationDelay: '1.2s' }} />
        </g>
      </svg>
    </div>
  );
};

BackgroundAtmosphere.displayName = 'BackgroundAtmosphere';
