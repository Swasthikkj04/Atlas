import React from 'react';

export const HeroConstellation: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.85,
        zIndex: 1,
      }}
    >
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <defs>
          {/* Attenuated Gaussian Blur Filter */}
          <filter id="node_glow_attenuated" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
          </filter>
        </defs>

        {/* Outer Mesh Connections */}
        <path d="M 80,260 L 240,310 L 420,220 L 820,280 L 1200,280 L 1380,340" stroke="#3743db" strokeOpacity="0.14" strokeWidth="1.2" />
        <path d="M 240,310 L 180,680 L 720,720 L 1260,680 L 1200,280" stroke="#3743db" strokeOpacity="0.12" strokeWidth="1" />
        <path d="M 80,260 L 180,680 L 720,720 L 1380,340" stroke="#3743db" strokeOpacity="0.10" strokeWidth="1" />

        {/* Micro Intersecting Nodes */}
        <circle cx="80" cy="260" r="3" fill="#3743db" fillOpacity="0.25" />
        <circle cx="420" cy="220" r="3.5" fill="#3743db" fillOpacity="0.25" />
        <circle cx="1020" cy="180" r="3" fill="#3743db" fillOpacity="0.2" />
        <circle cx="1380" cy="340" r="3.5" fill="#3743db" fillOpacity="0.25" />

        {/* Network Node 1 (Top Left / Attenuated Glow) */}
        <g>
          <circle
            cx="240"
            cy="310"
            r="18"
            fill="#6366f1"
            opacity="0.12"
            filter="url(#node_glow_attenuated)"
          />
          <circle cx="240" cy="310" r="3" fill="#4f46e5" opacity="0.55" />
        </g>

        {/* Network Node 2 (Top Right / Attenuated Glow) */}
        <g>
          <circle
            cx="820"
            cy="280"
            r="20"
            fill="#6366f1"
            opacity="0.10"
            filter="url(#node_glow_attenuated)"
          />
          <circle cx="820" cy="280" r="3.5" fill="#4f46e5" opacity="0.50" />
        </g>
      </svg>
    </div>
  );
};

HeroConstellation.displayName = 'HeroConstellation';
