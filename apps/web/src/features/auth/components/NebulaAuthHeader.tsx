import React from 'react';
import { useTheme } from '../../guest/hooks/useTheme';

const MONO = "'JetBrains Mono', 'Courier New', monospace";

export const NebulaAuthHeader: React.FC = () => {
  const { theme, setMode } = useTheme();

  const handleToggle = () => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 h-14 flex items-center justify-between px-6 md:px-8 border-b border-border bg-background/80 backdrop-blur-sm">
      <a
        href="/"
        style={{ fontFamily: MONO }}
        className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-foreground transition-colors"
      >
        ARGONION <span className="opacity-40 mx-1">/</span> NEBULA
      </a>
      <button
        type="button"
        onClick={handleToggle}
        style={{ fontFamily: MONO }}
        className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground/60 hover:text-muted-foreground transition-colors px-2.5 py-1 rounded cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </header>
  );
};
