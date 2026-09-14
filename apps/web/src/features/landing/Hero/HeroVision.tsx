import React from 'react';

export const HeroVision: React.FC = () => {
  return (
    <p
      style={{
        fontSize: 'clamp(1rem, 1.25vw, 1.125rem)',
        lineHeight: 1.6,
        color: '#344054',
        fontWeight: 450,
        maxWidth: '540px',
        margin: '1.25rem auto 0 auto',
        textAlign: 'center',
        letterSpacing: '-0.01em',
      }}
    >
      We build systems that understand complex infrastructure so engineering teams can focus on what matters.
    </p>
  );
};

HeroVision.displayName = 'HeroVision';
