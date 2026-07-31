import React from 'react';

export const HeroSignature: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '7rem',
        paddingBottom: '3rem',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Structural Hairline Accent */}
      <div
        style={{
          width: '36px',
          height: '1px',
          backgroundColor: 'rgba(11, 12, 16, 0.12)',
          marginBottom: '3.5rem',
        }}
      />

      {/* Main Brand Lockup */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: '1.25rem',
        }}
      >
        {/* =========================================================================
            NEBULA SYMBOL: Restrained, Subdued Amber Mark (25% Smaller)
            ========================================================================= */}
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transform: 'translateY(6px)',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Soft Amber Top-Left Corner Bracket */}
            <path
              d="M 10 22 V 14 C 10 12.3431 11.3431 11 13 11 H 21"
              stroke="#ea580c"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* Soft Amber Bottom-Right Corner Bracket */}
            <path
              d="M 54 42 V 50 C 54 51.6569 52.6569 53 51 53 H 43"
              stroke="#ea580c"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* Soft, Desaturated Amber Cloud Blur */}
            <g filter="url(#subdued_amber_blur)">
              <circle cx="32" cy="32" r="15" fill="url(#subdued_outer)" opacity="0.55" />
              <circle cx="30" cy="30" r="9" fill="url(#subdued_core)" opacity="0.8" />
            </g>

            <defs>
              <filter
                id="subdued_amber_blur"
                x="0"
                y="0"
                width="64"
                height="64"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="3.5" result="blur" />
              </filter>

              <radialGradient
                id="subdued_outer"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(32 32) scale(18)"
              >
                <stop stopColor="#f97316" stopOpacity="0.6" />
                <stop offset="1" stopColor="#c2410c" stopOpacity="0" />
              </radialGradient>

              <radialGradient
                id="subdued_core"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(30 30) scale(10)"
              >
                <stop stopColor="#fed7aa" />
                <stop offset="1" stopColor="#ea580c" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* =========================================================================
            PRIMARY WORDMARK: Scaled Up ~7% for Hero Dominance
            ========================================================================= */}
        <h1
          style={{
            fontSize: 'clamp(3.75rem, 7.2vw, 6.75rem)',
            fontWeight: 850,
            letterSpacing: '-0.048em',
            color: '#0b0c10',
            margin: 0,
            lineHeight: 1,
            fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
          }}
        >
          Nebula
        </h1>
      </div>

      {/* Subtitle Descriptor (2.25rem spacing above) */}
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#475467',
          marginTop: '2.25rem',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        }}
      >
        Infrastructure Intelligence Platform
      </span>

      {/* Anchored Primary CTA (5rem spacing above) */}
      <div style={{ marginTop: '5rem' }}>
        <a
          href="#nebula"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#0b0c10',
            color: '#ffffff',
            padding: '0.85rem 1.85rem',
            borderRadius: '9999px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            boxShadow: '0 10px 25px -5px rgba(11, 12, 16, 0.25)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <span>Enter Nebula</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>↗</span>
        </a>
      </div>
    </div>
  );
};

HeroSignature.displayName = 'HeroSignature';
