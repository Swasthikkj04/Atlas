import React from 'react';
import logoMark from '/argonion-mark.svg';
import type { NavbarProps, NavLinkItem } from './Navbar.types';

const DEFAULT_LINKS: NavLinkItem[] = [
  { label: 'Why Argonion', href: '#why-argonion' },
  { label: 'Nebula', href: '#nebula' },
];

export const Navbar: React.FC<NavbarProps> = ({
  links = DEFAULT_LINKS,
  loginHref = '/auth/login',
  ctaText = 'Enter Nebula',
  ctaHref = '/guest',
}) => {
  const displayLinks = links && links.length > 0 ? links : DEFAULT_LINKS;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: '100%',
        height: '72px',
        zIndex: 100,
        backgroundColor: 'rgba(248, 249, 252, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(228, 231, 240, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand Logo & Name */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <img src={logoMark} alt="Argonion Logo" style={{ width: '24px', height: '24px', display: 'block' }} />
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            letterSpacing: '0.08em',
            color: '#0b0c10',
            textTransform: 'uppercase',
          }}
        >
          ARGONION
        </span>
      </a>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        {displayLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{ color: '#4a5068', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}
            target={link.isExternal ? '_blank' : undefined}
            rel={link.isExternal ? 'noopener noreferrer' : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <a href={loginHref} style={{ color: '#4a5068', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>
          Login
        </a>
        <a
          href={ctaHref}
          style={{
            backgroundColor: '#090a10',
            color: '#ffffff',
            padding: '0.55rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {ctaText} ↗
        </a>
      </div>
    </header>
  );
};

Navbar.displayName = 'Navbar';
