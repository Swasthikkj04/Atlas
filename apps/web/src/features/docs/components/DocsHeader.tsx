import React from 'react';
import { Search, Moon, Sun, ArrowRight } from 'lucide-react';
import { ArgonionMark } from '../../../components/branding/ArgonionMark';
import { useTheme } from '../../guest/hooks/useTheme';

interface DocsHeaderProps {
  onSearchClick?: () => void;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({ onSearchClick }) => {
  const { theme, setMode } = useTheme();

  const toggleTheme = () => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 h-14 w-full border-b border-border bg-background/95 backdrop-blur-xs transition-colors"
    >
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Brand & Editorial Path Hierarchy */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <a
            href="/"
            className="flex items-center gap-2 font-mono text-xs tracking-[0.16em] uppercase text-foreground hover:opacity-80 transition-opacity focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring rounded py-1"
            aria-label="Argonion Nebula Documentation Home"
          >
            <div className="size-5 rounded border border-border flex items-center justify-center text-foreground bg-muted/40">
              <ArgonionMark size={12} className="text-foreground" />
            </div>
            <span className="font-semibold text-foreground">ARGONION</span>
          </a>

          <span className="text-muted-foreground/30 font-mono text-xs select-none">/</span>
          <span className="font-mono text-xs tracking-wider uppercase text-foreground/80 font-medium select-none">
            NEBULA
          </span>

          <span className="text-muted-foreground/30 font-mono text-xs select-none">/</span>
          <span className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase select-none">
            DOCS
          </span>
        </div>

        {/* Center Search Utility */}
        <div className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md 2xl:max-w-lg mx-6 2xl:mx-10">
          <button
            type="button"
            onClick={onSearchClick}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-mono bg-muted/30 hover:bg-muted/60 border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Search documentation"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span className="text-muted-foreground/80">Search documentation...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-muted-foreground font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/guest"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/40"
          >
            <span>Guest Workspace</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/70" />
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-md border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
