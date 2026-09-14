import React, { useState, useEffect } from 'react';
import { telemetry } from '../../../services';

const NAV_ITEMS = [
  { id: 'nebula', label: 'Architecture', href: '#nebula' },
  { id: 'why-nebula', label: 'Why Nebula', href: '#why-nebula' },
  { id: 'docs', label: 'Docs', href: '/docs' },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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

  const handleNavItemClick = (itemId: string) => {
    setMobileMenuOpen(false);
    if (itemId === 'docs') {
      telemetry.track('EXPLORE_DOCS_CTA', {
        path: '/',
        surface: 'landing',
        section: 'docs',
        ctaLocation: 'navbar',
      });
    }
  };

  const handleLaunchNebula = () => {
    setMobileMenuOpen(false);
    telemetry.track('SCAN_DOMAIN_CTA', {
      path: '/',
      surface: 'landing',
      ctaLocation: 'navbar',
    });
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        backgroundColor: scrolled ? 'rgba(248, 249, 252, 0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(209, 213, 225, 0.6)' : '1px solid transparent',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, backdrop-filter 0.2s ease',
      }}
    >
      {/* Brand Lockup */}
      <a
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          textDecoration: 'none',
        }}
      >
        <img
          src="/argonion-mark.svg"
          alt="Nebula Logo"
          style={{ width: '24px', height: '24px', display: 'block' }}
        />
        <span
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#0b0c10',
            textTransform: 'uppercase',
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          NEBULA
        </span>
      </a>

      {/* Desktop Horizontal Navigation */}
      <div
        className="desktop-nav-items"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleNavItemClick(item.id)}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.01em',
                  color: '#0b0c10',
                  opacity: isActive ? 1.0 : 0.7,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease, color 0.15s ease',
                  position: 'relative',
                  padding: '0.25rem 0',
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <a
          href="/guest"
          onClick={handleLaunchNebula}
          style={{
            backgroundColor: '#090a10',
            color: '#ffffff',
            height: '36px',
            padding: '0 1.15rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 650,
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            transition: 'opacity 0.15s ease',
          }}
        >
          <span>Enter Nebula</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>↗</span>
        </a>
      </div>

      {/* Mobile Header Trigger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="mobile-nav-trigger"
        aria-label="Toggle navigation menu"
        style={{
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
                href={item.href}
                onClick={() => handleNavItemClick(item.id)}
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
            href="/guest"
            onClick={handleLaunchNebula}
            style={{
              backgroundColor: '#090a10',
              color: '#ffffff',
              height: '38px',
              padding: '0 1rem',
              borderRadius: '9999px',
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
            <span>Enter Nebula</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>↗</span>
          </a>
        </div>
      )}

      {/* Breakpoint Style Rules */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav-items {
            display: flex !important;
          }
          .mobile-nav-trigger {
            display: none !important;
          }
          .mobile-nav-overlay {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-nav-items {
            display: none !important;
          }
          .mobile-nav-trigger {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};

Navbar.displayName = 'Navbar';
