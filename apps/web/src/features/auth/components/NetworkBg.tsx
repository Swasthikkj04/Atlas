import React from 'react';

export interface NetworkBgProps {
  dark?: boolean;
}

export const NetworkBg: React.FC<NetworkBgProps> = ({ dark = true }) => {
  const line = dark ? 'rgba(255,255,255,0.038)' : 'rgba(12,12,20,0.04)';
  const node = dark ? 'rgba(255,255,255,0.075)' : 'rgba(12,12,20,0.062)';
  const grid = dark ? 'rgba(255,255,255,0.016)' : 'rgba(12,12,20,0.019)';

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="nebula-cg" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0L0 0 0 64" fill="none" stroke={grid} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#nebula-cg)" />
      <line x1="8%" y1="11%" x2="30%" y2="23%" stroke={line} strokeWidth="1" />
      <line x1="30%" y1="23%" x2="58%" y2="12%" stroke={line} strokeWidth="1" />
      <line x1="58%" y1="12%" x2="84%" y2="31%" stroke={line} strokeWidth="1" />
      <line x1="30%" y1="23%" x2="47%" y2="57%" stroke={line} strokeWidth="1" />
      <line x1="8%" y1="11%" x2="19%" y2="69%" stroke={line} strokeWidth="1" />
      <line x1="19%" y1="69%" x2="47%" y2="57%" stroke={line} strokeWidth="1" />
      <line x1="47%" y1="57%" x2="84%" y2="31%" stroke={line} strokeWidth="1" />
      <line x1="58%" y1="12%" x2="47%" y2="57%" stroke={line} strokeWidth="1" />
      <line x1="84%" y1="31%" x2="73%" y2="77%" stroke={line} strokeWidth="1" />
      <line x1="47%" y1="57%" x2="73%" y2="77%" stroke={line} strokeWidth="1" />
      <circle cx="8%" cy="11%" r="2.5" fill={node} />
      <circle cx="30%" cy="23%" r="4" fill={node} />
      <circle cx="58%" cy="12%" r="2.5" fill={node} />
      <circle cx="84%" cy="31%" r="2.5" fill={node} />
      <circle cx="19%" cy="69%" r="2.5" fill={node} />
      <circle cx="47%" cy="57%" r="4.5" fill={node} />
      <circle cx="73%" cy="77%" r="2" fill={node} />
    </svg>
  );
};
