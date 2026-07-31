import React from 'react';
import { HeroSignature } from './HeroSignature';
import { HeroConstellation } from './HeroConstellation';
import { HeroVision } from './HeroVision';

export const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '116px 2rem 4rem 2rem',
        boxSizing: 'border-box',
        backgroundColor: '#f8f9fc',
        overflow: 'hidden',
      }}
    >
      {/* Precision Grid Matrix Background Layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          backgroundColor: '#f8f9fc',
          backgroundImage: `
            radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
            linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 60%, transparent 100%)',
        }}
      />

      {/* Tactile SVG Noise Texture Layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.035,
          mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Attenuated Constellation Mesh SVG Canvas Layer */}
      <HeroConstellation />

      {/* Hero Content Layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          maxWidth: '1080px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Inline Hero Pill/Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(209, 213, 225, 0.8)',
            boxShadow: '0 2px 8px rgba(11, 12, 16, 0.04)',
            marginBottom: '1.75rem',
          }}
        >
          {/* Pulsing Active Indicator */}
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#3743db',
              boxShadow: '0 0 8px #3743db',
            }}
          />
          <span
            style={{
              fontSize: '0.775rem',
              fontWeight: 600,
              color: '#2d3142',
              letterSpacing: '0.01em',
            }}
          >
            Introducing Nebula Engine v1.0
          </span>
        </div>

        {/* Dynamic Fluid Headline */}
        <h1
          style={{
            fontSize: 'clamp(3.5rem, 6.2vw, 5.5rem)',
            fontWeight: 850,
            lineHeight: 1.05,
            letterSpacing: '-0.038em',
            color: '#0b0c10',
            marginTop: 0,
            marginBottom: '1.5rem',
            maxWidth: '1000px',
          }}
        >
          Engineering Intelligence <br />
          <span
            style={{
              backgroundImage: 'linear-gradient(135deg, #1d4ed8 0%, #3743db 45%, #6d28d9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            for Modern Infrastructure.
          </span>
        </h1>

        {/* High-Contrast Supporting Text */}
        <HeroVision />

        {/* Refined Product Signature Block with Integrated Brand Symbol & Primary Action CTA */}
        <HeroSignature />
      </div>

      {/* Scroll Down Chevron */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          opacity: 0.5,
        }}
      >
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L8 8L15 1" stroke="#8E94A5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
};

Hero.displayName = 'Hero';
