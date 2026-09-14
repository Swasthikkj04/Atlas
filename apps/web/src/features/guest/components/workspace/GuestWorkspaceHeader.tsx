import React from 'react';
import {
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { DomainFavicon } from '../../../workspace/components/identity/DomainFavicon';
import { ArgonionMark } from '../../../../components/branding/ArgonionMark';

interface GuestWorkspaceHeaderProps {
  domain: string;
  onReset: () => void;
  onClaim: () => void;
  className?: string;
}

export const GuestWorkspaceHeader: React.FC<GuestWorkspaceHeaderProps> = ({
  domain,
  onReset,
  onClaim,
  className = '',
}) => {
  return (
    <header
      role="banner"
      aria-label="Guest Workspace Header"
      className={`w-full sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/70 transition-colors ${className}`}
    >
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Region: Logo + Domain Identity Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Brand Mark */}
          <div className="flex items-center gap-2.5 select-none shrink-0">
            <div className="size-8 rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.08] border border-border/80 flex items-center justify-center text-foreground shadow-xs">
              <ArgonionMark size={19} className="text-foreground" />
            </div>
            <div className="hidden md:flex items-center gap-1.5 font-mono text-xs tracking-[0.18em] uppercase font-semibold text-foreground">
              <span>ARGONION</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground font-bold">NEBULA</span>
            </div>
          </div>

          <div className="h-4 w-px bg-border/80 hidden sm:block shrink-0" />

          {/* Domain Context Identity Pill */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 bg-card border border-border/80 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-[0_1px_3px_rgba(16,24,20,0.04)]">
            <DomainFavicon domain={domain} size="compact" />
            <span className="font-mono text-[13px] sm:text-[14px] font-bold text-foreground truncate max-w-[160px] sm:max-w-[280px]">
              {domain}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden xs:inline">Verified</span>
              </span>
              <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#5F625F] dark:text-muted-foreground bg-muted/60 border border-border/60">
                Ephemeral Session
              </span>
            </div>
          </div>
        </div>

        {/* Right Region: Secondary Reset + Primary Claim CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Reset / New Domain Action */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted px-2.5 sm:px-3 py-1.5 rounded-xl border border-border/70 transition-all cursor-pointer focus-ring"
            title="Analyze another domain"
            aria-label="Analyze another domain"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">New Domain</span>
          </button>

          {/* Claim Infrastructure Button */}
          <button
            type="button"
            onClick={onClaim}
            className="group inline-flex items-center gap-2 text-[12px] sm:text-[13px] font-semibold bg-[#111827] hover:bg-black text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 active:scale-[0.98] px-3.5 sm:px-4 py-1.5 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.08)] transition-all cursor-pointer focus-ring"
            aria-label={`Claim ${domain} into permanent workspace`}
          >
            <span>Claim Infrastructure</span>
            <ArrowRight className="size-3.5 text-current transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </header>
  );
};
