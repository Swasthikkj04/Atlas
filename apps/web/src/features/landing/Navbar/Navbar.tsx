import React, { useState, useEffect } from 'react';
import { RightRailNav } from './RightRailNav';

const NAV_ITEMS = [
  { id: 'why-argonion', label: 'Why Argonion' },
  { id: 'nebula', label: 'Nebula' },
  { id: 'docs', label: 'Docs' },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const section = document.getElementById(NAV_ITEMS[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(NAV_ITEMS[i].id);
          return;
        }
      }
      setActiveSection('');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Brand Anchor: Direct Root Canvas Placement */}
      <a
        href="/"
        style={{
          position: 'fixed',
          top: '32px',
          left: '3rem',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          textDecoration: 'none',
        }}
      >
        <img
          src="/argonion-mark.svg"
          alt="Argonion Logo"
          style={{ width: '24px', height: '24px', display: 'block' }}
        />
        <span
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#0b0c10',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          ARGONION
        </span>
      </a>

      {/* Desktop Vertical Right Rail (>= 1024px) */}
      <RightRailNav />

      {/* Mobile Header Trigger (< 1024px) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="mobile-nav-trigger"
        aria-label="Toggle navigation menu"
        style={{
          position: 'fixed',
          top: '28px',
          right: '2rem',
          zIndex: 200,
          backgroundColor: 'rgba(248, 249, 252, 0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(209, 213, 225, 0.8)',
          borderRadius: '4px',
          padding: '0.45rem 0.85rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#0b0c10',
          cursor: 'pointer',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: '0 2px 8px rgba(11, 12, 16, 0.04)',
        }}
      >
        <span>MENU</span>
        <span>{mobileMenuOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-overlay"
          style={{
            position: 'fixed',
            top: '72px',
            right: '2rem',
            zIndex: 200,
            width: '220px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(209, 213, 225, 0.8)',
            borderRadius: '8px',
            padding: '1.25rem',
            boxShadow: '0 12px 32px rgba(11, 12, 16, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: activeSection === item.id ? 700 : 500,
                  color: '#0b0c10',
                  textDecoration: 'none',
                  opacity: activeSection === item.id ? 1.0 : 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                {activeSection === item.id && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#3743db',
                    }}
                  />
                )}
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div style={{ height: '1px', backgroundColor: 'rgba(209, 213, 225, 0.6)' }} />
          <a
            href="#launch"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              backgroundColor: '#090a10',
              color: '#ffffff',
              height: '38px',
              padding: '0 1rem',
              borderRadius: '4px',
              fontSize: '0.9375rem',
              fontWeight: 700,
              opacity: 0.95,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
            }}
          >
            <span>Launch Nebula</span>
            <span style={{ fontFamily: 'monospace' }}>→</span>
          </a>
        </div>
      )}

      {/* Breakpoint Style Rules */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-right-rail {
            display: flex !important;
          }
          .mobile-nav-trigger {
            display: none !important;
          }
          .mobile-nav-overlay {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .desktop-right-rail {
            display: none !important;
          }
          .mobile-nav-trigger {
            display: flex !important;
          }
        }
        .rail-nav-link:hover {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
};

Navbar.displayName = 'Navbar';
