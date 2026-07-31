import React from 'react';

type Node = { id: string; x: number; y: number; r: number; hub?: boolean };
type Edge = { from: string; to: string };

const nodes: Node[] = [
  { id: 'n1', x: 90, y: 200, r: 3.5 },
  { id: 'n2', x: 210, y: 120, r: 3 },
  { id: 'n3', x: 205, y: 300, r: 4 },
  { id: 'n4', x: 360, y: 230, r: 3 },
  { id: 'n5', x: 470, y: 130, r: 3.5 },
  { id: 'hub', x: 600, y: 270, r: 7, hub: true },
  { id: 'n6', x: 470, y: 350, r: 3 },
  { id: 'n7', x: 740, y: 170, r: 3 },
  { id: 'n8', x: 760, y: 340, r: 4 },
  { id: 'n9', x: 900, y: 240, r: 3 },
  { id: 'n10', x: 1010, y: 140, r: 3.5 },
  { id: 'n11', x: 1030, y: 320, r: 3 },
  { id: 'n12', x: 40, y: 330, r: 2.5 },
  { id: 'n13', x: 1110, y: 250, r: 2.5 },
];

const edges: Edge[] = [
  { from: 'n1', to: 'n2' },
  { from: 'n1', to: 'n3' },
  { from: 'n12', to: 'n3' },
  { from: 'n2', to: 'n4' },
  { from: 'n3', to: 'n4' },
  { from: 'n4', to: 'n5' },
  { from: 'n4', to: 'hub' },
  { from: 'n5', to: 'hub' },
  { from: 'n6', to: 'hub' },
  { from: 'n4', to: 'n6' },
  { from: 'hub', to: 'n7' },
  { from: 'hub', to: 'n8' },
  { from: 'n7', to: 'n9' },
  { from: 'n8', to: 'n9' },
  { from: 'n9', to: 'n10' },
  { from: 'n9', to: 'n11' },
  { from: 'n10', to: 'n13' },
  { from: 'n11', to: 'n13' },
];

const findNode = (id: string) => nodes.find((n) => n.id === id)!;

export interface HeroBackgroundProps {
  className?: string;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({ className = '' }) => {
  const hub = findNode('hub');

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
      className={className}
      aria-hidden="true"
    >
      <svg
        style={{ width: '100%', height: '100%', display: 'block' }}
        viewBox="0 0 1150 460"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fieldFade" cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="var(--bg-app)" stopOpacity="0" />
            <stop offset="78%" stopColor="var(--bg-app)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--bg-app)" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Connection lines */}
        <g stroke="var(--border-strong)" strokeWidth="1">
          {edges.map((e, i) => {
            const a = findNode(e.from);
            const b = findNode(e.to);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>

        {/* Soft blue glow beneath CTA / hub node */}
        <circle cx={hub.x} cy={hub.y} r={64} fill="url(#hubGlow)" />

        {/* Nodes */}
        <g>
          {nodes.map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={n.hub ? 'var(--accent-primary)' : 'var(--text-muted)'}
              fillOpacity={n.hub ? 1 : 0.45}
            />
          ))}
        </g>

        {/* Peripheral fade overlay */}
        <rect x="0" y="0" width="1150" height="460" fill="url(#fieldFade)" />
      </svg>
    </div>
  );
};

HeroBackground.displayName = 'HeroBackground';
