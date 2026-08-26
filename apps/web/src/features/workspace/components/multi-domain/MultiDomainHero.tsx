import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Display, Eyebrow } from '../../../../components/typography';
import { Stack, Cluster } from '../../../../components/layout';
import type { MultiDomainHeroProps } from './WorkspaceIntelligenceLanding.types';

/**
 * Premium Multi-Domain Briefing Hero (WX-1025).
 *
 * Implements the authoritative Workspace Intelligence Briefing Hero:
 * - Direct, calm expert tone without chatbot / greeting theater
 * - Prominently features the Primary Intelligence State (Quiet vs Changes vs Attention vs In Progress)
 * - Silence as a premier product feature ("Silence is preferable to manufactured activity")
 * - Strictly derived from authoritative backend snapshots
 */
export const MultiDomainHero: React.FC<MultiDomainHeroProps> = ({
  brief,
  onReviewChanges,
  className = '',
}) => {
  const isQuiet = brief.state === 'QUIET';
  const hasChanges = brief.state === 'CHANGES_DETECTED';
  const hasAttention = brief.state === 'ATTENTION_REQUIRED';
  const isVerifying = brief.state === 'UNDERSTANDING_IN_PROGRESS';

  const statusColorMap = {
    QUIET: {
      dot: 'bg-[#178A68]',
      badgeText: 'text-[#178A68]',
      badgeBg: 'bg-[#EAF7F2]',
      badgeBorder: 'border-[#B9E5D6]',
      icon: CheckCircle2,
      label: 'STABLE BASELINE',
    },
    CHANGES_DETECTED: {
      dot: 'bg-[#3568C8]',
      badgeText: 'text-[#3568C8]',
      badgeBg: 'bg-[#EEF4FF]',
      badgeBorder: 'border-[#C8D8F6]',
      icon: ShieldCheck,
      label: 'CHANGES RECORDED',
    },
    ATTENTION_REQUIRED: {
      dot: 'bg-[#B86F18]',
      badgeText: 'text-[#B86F18]',
      badgeBg: 'bg-[#FFF4E3]',
      badgeBorder: 'border-[#F0D3A5]',
      icon: AlertTriangle,
      label: 'ATTENTION RECOMMENDED',
    },
    UNDERSTANDING_IN_PROGRESS: {
      dot: 'bg-[#3568C8]',
      badgeText: 'text-[#3568C8]',
      badgeBg: 'bg-[#EEF4FF]',
      badgeBorder: 'border-[#C8D8F6]',
      icon: RefreshCw,
      label: 'VERIFYING UNDERSTANDINGS',
    },
    NO_DOMAINS: {
      dot: 'bg-[#5F625F]',
      badgeText: 'text-[#5F625F]',
      badgeBg: 'bg-[#F4F4F1]',
      badgeBorder: 'border-[#E2E2DD]',
      icon: ShieldCheck,
      label: 'SETUP REQUIRED',
    },
  };

  const currentTheme = statusColorMap[brief.state] || statusColorMap.QUIET;

  return (
    <Stack gap="lg" className={`w-full ${className}`} data-testid="multi-domain-hero">
      {/* 1. Briefing Tagline & Category Context */}
      <Stack gap="xs">
        <Cluster justify="between" align="center">
          <Eyebrow
            variant="muted"
            className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#5F625F] dark:text-muted-foreground font-semibold"
          >
            WORKSPACE INTELLIGENCE
          </Eyebrow>

          <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
            {brief.subtitle}
          </span>
        </Cluster>

        <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
          Infrastructure intelligence
        </Display>
      </Stack>

      {/* 2. The Primary Intelligence State (The Most Important Visual Object) */}
      <div
        className="p-6 sm:p-7 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-4"
        data-testid="primary-intelligence-state"
      >
        {/* Status Indicator Header */}
        <Cluster justify="between" align="center" gap="sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${currentTheme.dot} ${isVerifying ? 'animate-pulse' : ''} shrink-0`}
            />
            <span
              className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${currentTheme.badgeText}`}
            >
              {currentTheme.label}
            </span>
          </div>

          <span
            className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${currentTheme.badgeText} ${currentTheme.badgeBg} ${currentTheme.badgeBorder}`}
          >
            {isQuiet
              ? 'ALL SYSTEMS MONITORED'
              : hasChanges
              ? `${brief.totalChangesCount} ${brief.totalChangesCount === 1 ? 'CHANGE' : 'CHANGES'}`
              : hasAttention
              ? 'CONDITIONS OBSERVED'
              : isVerifying
              ? 'VERIFYING'
              : 'IDLE'}
          </span>
        </Cluster>

        {/* Primary Statement */}
        <div className="space-y-1.5 max-w-3xl">
          <h2
            className="text-lg sm:text-xl font-medium text-foreground tracking-tight leading-snug"
            data-testid="briefing-headline"
          >
            {brief.headline}
          </h2>
          <p
            className="text-xs sm:text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed font-normal"
            data-testid="briefing-explanation"
          >
            {brief.explanation}
          </p>
        </div>

        {/* Action Button for Changes */}
        {hasChanges && onReviewChanges && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onReviewChanges}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#3568C8] hover:underline cursor-pointer transition-colors"
              data-testid="review-changes-hero-button"
            >
              <span>Review changes across domains</span>
              <Icon icon={ArrowRight} size="small" />
            </button>
          </div>
        )}
      </div>
    </Stack>
  );
};

MultiDomainHero.displayName = 'MultiDomainHero';
