import React, { useState } from 'react';
import { ArrowRight, Globe, Shield, CheckCircle2, Zap } from 'lucide-react';
import { telemetry, type TelemetryEvent } from '../../../services';

const FOOTER_LINKS: Array<{ label: string; href: string; action?: TelemetryEvent; external?: boolean }> = [
  { label: 'Documentation', href: '/docs', action: 'EXPLORE_DOCS_CTA' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

export const FinalManifestoAndFooter: React.FC = () => {
  const [domainInput, setDomainInput] = useState('');

  const handleEnterNebula = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    telemetry.track('SCAN_DOMAIN_CTA', {
      path: '/',
      surface: 'landing',
      ctaLocation: 'footer',
      submittedDomain: domainInput.trim() || undefined,
    });

    const cleanDomain = domainInput.trim();
    const targetPath = cleanDomain
      ? `/guest?domain=${encodeURIComponent(cleanDomain)}`
      : '/guest';

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo(0, 0);
    }
  };

  const handleFooterLinkClick = (action?: TelemetryEvent) => {
    if (action) {
      telemetry.track(action, {
        path: '/',
        surface: 'landing',
        ctaLocation: 'footer',
      });
    }
  };

  return (
    <div style={{ backgroundColor: '#050608', color: '#f8fafc', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
      {/* =========================================================================
          1. HIGH-IMPACT FINAL CTA SECTION
          ========================================================================= */}
      <section
        style={{
          padding: '8rem 2rem 6rem 2rem',
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center',
          fontFamily: 'Inter, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#38bdf8',
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              }}
            >
              Perimeter Exploration
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.5rem, 4.8vw, 4rem)',
              fontWeight: 850,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              marginTop: 0,
              marginBottom: '1.25rem',
              color: '#ffffff',
            }}
          >
            Ready to inspect your infrastructure?
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: '#94a3b8',
              maxWidth: '620px',
              margin: '0 auto 3rem auto',
            }}
          >
            Experience how Nebula reconstructs ingress topologies, validates cryptographic hygiene, and uncovers causal state drift in seconds.
          </p>

          {/* Interactive Quick-Launch Bar */}
          <form
            onSubmit={handleEnterNebula}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              maxWidth: '560px',
              margin: '0 auto',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: '1 1 300px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Globe
                style={{
                  position: 'absolute',
                  left: '1rem',
                  width: '18px',
                  height: '18px',
                  color: '#64748b',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="Enter domain (e.g. stripe.com or company.io)"
                style={{
                  width: '100%',
                  padding: '0.95rem 1rem 0.95rem 2.75rem',
                  backgroundColor: '#0d1017',
                  border: '1px solid #222938',
                  borderRadius: '9999px',
                  color: '#ffffff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#222938';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#050608',
                padding: '0.95rem 2rem',
                borderRadius: '9999px',
                fontSize: '0.9375rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                boxShadow: '0 10px 25px -5px rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Inspect Perimeter</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
          </form>

          {/* Value Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              marginTop: '3.5rem',
              flexWrap: 'wrap',
              fontSize: '0.8125rem',
              color: '#64748b',
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 style={{ width: '14px', height: '14px', color: '#10b981' }} />
              <span>Zero Agent Installation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Shield style={{ width: '14px', height: '14px', color: '#38bdf8' }} />
              <span>Cryptographically Auditable</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Zap style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
              <span>Instant Ingress Discovery</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. FOOTER: Minimal & Utility-First for Engineers
          ========================================================================= */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4rem 2rem 5rem 2rem',
          maxWidth: '1100px',
          margin: '0 auto',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
          }}
        >
          {/* Brand Wordmark Anchor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Nebula
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              // Infrastructure Intelligence Platform
            </span>
          </div>

          {/* Engineer Utility Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2.25rem',
            }}
          >
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => handleFooterLinkClick(link.action)}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                style={{
                  fontSize: '0.8125rem',
                  color: '#E2E8F0',
                  textDecoration: 'none',
                  transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#E2E8F0')}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Systemic Copyright / Spec Line */}
        <div
          style={{
            marginTop: '3.5rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          <span>© {new Date().getFullYear()} Argonion. All rights reserved.</span>
          <span>AUTONOMY THROUGH COMPREHENSION</span>
        </div>
      </footer>
    </div>
  );
};

FinalManifestoAndFooter.displayName = 'FinalManifestoAndFooter';
