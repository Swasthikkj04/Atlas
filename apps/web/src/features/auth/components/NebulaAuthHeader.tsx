import React from 'react';
import { useTheme } from '../../guest/hooks/useTheme';
import { ArgonionMark } from '../../../components/branding/ArgonionMark';

export const NebulaAuthHeader: React.FC = () => {
  const { theme, setMode } = useTheme();

  const handleToggle = () => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 h-14 flex items-center justify-between px-6 md:px-8 border-b border-border bg-background/80 backdrop-blur-sm">
      <a
        href="/"
        className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        <div className="size-6 rounded-md bg-foreground/[0.06] dark:bg-foreground/[0.08] border border-border/80 flex items-center justify-center text-foreground shrink-0">
          <ArgonionMark size={14} className="text-foreground" />
        </div>
        <span>ARGONION</span>
        <span className="opacity-40">/</span>
        <span className="text-foreground font-semibold">NEBULA</span>
      </a>
      <button
        type="button"
        onClick={handleToggle}
        className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground/60 hover:text-muted-foreground transition-colors px-2.5 py-1 rounded cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </header>
  );
};
