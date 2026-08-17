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
        height: '56px',
        zIndex: 100,
        backgroundColor: 'rgba(248, 249, 252, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxSizing: 'border-box',
      }}
      className="sticky top-0 left-0 w-full h-[56px] z-[100] backdrop-blur-xl border-b border-white/[0.08]"
    >
      <div className="w-full max-w-6xl mx-auto h-[56px] py-3 px-6 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <a href="/" className="flex items-center gap-3 text-decoration-none">
          <img src={logoMark} alt="Argonion Logo" className="w-6 h-6 block" />
          <span className="font-bold text-lg tracking-wider text-foreground uppercase">
            ARGONION
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-8">
          {displayLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-normal tracking-[-0.01em] text-muted-foreground hover:text-foreground transition-colors text-decoration-none"
              target={link.isExternal ? '_blank' : undefined}
              rel={link.isExternal ? 'noopener noreferrer' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-8">
          <a href={loginHref} className="text-sm font-normal tracking-[-0.01em] text-muted-foreground hover:text-foreground transition-colors text-decoration-none">
            Login
          </a>
          <a
            href={ctaHref}
            className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-medium tracking-[-0.01em] bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all text-decoration-none"
          >
            {ctaText} ↗
          </a>
        </div>
      </div>
    </header>
  );
};

Navbar.displayName = 'Navbar';
