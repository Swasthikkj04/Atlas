import React, { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'why-argonion', label: 'Why Argonion' },
  { id: 'nebula', label: 'Nebula' },
  { id: 'docs', label: 'Docs' },
];

export const RightRailNav: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showRail, setShowRail] = useState<boolean>(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide rail when scrolling past 300px threshold to prevent section overlap
      setShowRail(window.scrollY < 300);

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
    <aside
      className="desktop-right-rail"
      style={{
        position: 'fixed',
        right: '3rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 200,
        width: '220px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        opacity: showRail ? 1 : 0,
        pointerEvents: showRail ? 'auto' : 'none',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      {/* Precision Vertical Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rail-nav-link"
              style={{
                fontSize: '0.9375rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
                color: '#0b0c10',
                opacity: isActive ? 1.0 : 0.75,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                transition: 'opacity 0.2s ease, color 0.2s ease, font-weight 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#3743db',
                  display: 'inline-block',
                  opacity: isActive ? 1.0 : 0,
                  transition: 'opacity 0.2s ease',
                  flexShrink: 0,
                }}
              />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Hairline Divider */}
      <div
        style={{
          width: '48px',
          height: '1px',
          backgroundColor: 'rgba(209, 213, 225, 0.9)',
          margin: '1.25rem 0',
        }}
      />

      {/* Action Link: Launch Nebula */}
      <a
        href="#launch"
        style={{
          backgroundColor: '#090a10',
          color: '#ffffff',
          height: '38px',
          padding: '0 1rem',
          borderRadius: '4px',
          fontSize: '0.9375rem',
          fontWeight: 700,
          letterSpacing: '0.01em',
          opacity: 0.95,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 1px 3px rgba(11, 12, 16, 0.12)',
          transition: 'background-color 0.2s ease, opacity 0.2s ease',
        }}
      >
        <span>Launch Nebula</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#94a3b8' }}>→</span>
      </a>
    </aside>
  );
};

RightRailNav.displayName = 'RightRailNav';
