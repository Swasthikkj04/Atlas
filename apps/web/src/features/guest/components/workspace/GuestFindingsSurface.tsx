import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Terminal,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import { DomainFavicon } from '../../../workspace/components/identity/DomainFavicon';
import type {
  GuestWorkspaceViewModel,
  GuestWorkspaceTabId,
  FindingViewModel,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';

interface GuestFindingsSurfaceProps {
  viewModel: GuestWorkspaceViewModel;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
}

type SeverityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export const GuestFindingsSurface: React.FC<GuestFindingsSurfaceProps> = ({
  viewModel,
  onNavigateTab,
}) => {
  const { domain, findings, severityDistribution } = viewModel;
  const [activeSeverity, setActiveSeverity] = useState<SeverityFilter>('ALL');

  const filteredFindings = useMemo(() => {
    if (activeSeverity === 'ALL') return findings;
    return findings.filter((f) => f.severity === activeSeverity);
  }, [findings, activeSeverity]);

  const severityConfigs: Record<
    FindingViewModel['severity'],
    { label: string; badgeClass: string; accentColor: string; icon: React.FC<{ className?: string }> }
  > = {
    CRITICAL: {
      label: 'Critical',
      badgeClass: 'text-[#A93442] bg-[#FDEBEC] border-[#E9B3B9] dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/60',
      accentColor: '#C94B58',
      icon: AlertOctagon,
    },
    HIGH: {
      label: 'High',
      badgeClass: 'text-[#C24D57] bg-[#FFF0F1] border-[#F0C3C7] dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/60',
      accentColor: '#C98224',
      icon: AlertTriangle,
    },
    MEDIUM: {
      label: 'Medium',
      badgeClass: 'text-[#B86F18] bg-[#FFF4E3] border-[#F0D3A5] dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60',
      accentColor: '#C98224',
      icon: AlertTriangle,
    },
    LOW: {
      label: 'Low',
      badgeClass: 'text-[#3568C8] bg-[#EEF4FF] border-[#C8D8F6] dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/60',
      accentColor: '#3568C8',
      icon: Info,
    },
    INFORMATIONAL: {
      label: 'Informational',
      badgeClass: 'text-[#5F625F] bg-[#F4F4F1] border-[#E2E2DD] dark:text-muted-foreground dark:bg-muted dark:border-border',
      accentColor: '#DCDCD6',
      icon: Info,
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Severity Distribution Bar */}
      <section
        aria-labelledby="findings-summary-title"
        className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_2px_8px_rgba(16,24,20,0.045)] dark:shadow-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#3568C8] dark:text-primary font-semibold">
              <ShieldAlert className="size-3.5" />
              <span>Perimeter Posture & Risk Intelligence</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <DomainFavicon domain={domain} size="secondary" />
              <h2
                id="findings-summary-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
              >
                Actionable Observations & Signals ({findings.length})
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Evidence-based perimeter findings discovered for <span className="font-mono text-foreground font-semibold">{domain}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-[#B86F18] bg-[#FFF4E3] border border-[#F0D3A5] dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60">
              <span>{severityDistribution.critical + severityDistribution.high} Actionable</span>
            </span>
          </div>
        </div>

        {/* Severity Count Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setActiveSeverity('ALL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
              activeSeverity === 'ALL'
                ? 'bg-card border-primary ring-1 ring-primary shadow-xs'
                : 'bg-muted/30 border-border/70 hover:bg-muted/50 hover:border-border'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-[#5F625F] dark:text-muted-foreground font-semibold">Total</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {severityDistribution.total}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSeverity('CRITICAL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
              activeSeverity === 'CRITICAL'
                ? 'bg-[#FDEBEC] border-[#E9B3B9] ring-1 ring-[#A93442] shadow-xs dark:bg-rose-950/50 dark:border-rose-700'
                : 'bg-muted/30 border-border/70 hover:bg-muted/50 hover:border-border'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-[#A93442] dark:text-rose-400 font-semibold">Critical</div>
            <div className="text-xl font-bold text-[#A93442] dark:text-rose-400 mt-0.5">
              {severityDistribution.critical}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSeverity('HIGH')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
              activeSeverity === 'HIGH'
                ? 'bg-[#FFF0F1] border-[#F0C3C7] ring-1 ring-[#C24D57] shadow-xs dark:bg-rose-950/50 dark:border-rose-700'
                : 'bg-muted/30 border-border/70 hover:bg-muted/50 hover:border-border'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-[#C24D57] dark:text-rose-400 font-semibold">High</div>
            <div className="text-xl font-bold text-[#C24D57] dark:text-rose-400 mt-0.5">
              {severityDistribution.high}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSeverity('MEDIUM')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
              activeSeverity === 'MEDIUM'
                ? 'bg-[#FFF4E3] border-[#F0D3A5] ring-1 ring-[#B86F18] shadow-xs dark:bg-amber-950/50 dark:border-amber-700'
                : 'bg-muted/30 border-border/70 hover:bg-muted/50 hover:border-border'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-[#B86F18] dark:text-amber-400 font-semibold">Medium</div>
            <div className="text-xl font-bold text-[#B86F18] dark:text-amber-400 mt-0.5">
              {severityDistribution.medium}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSeverity('LOW')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
              activeSeverity === 'LOW'
                ? 'bg-[#EEF4FF] border-[#C8D8F6] ring-1 ring-[#3568C8] shadow-xs dark:bg-blue-950/50 dark:border-blue-700'
                : 'bg-muted/30 border-border/70 hover:bg-muted/50 hover:border-border'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-[#3568C8] dark:text-blue-400 font-semibold">Low</div>
            <div className="text-xl font-bold text-[#3568C8] dark:text-blue-400 mt-0.5">
              {severityDistribution.low}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSeverity('INFORMATIONAL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
              activeSeverity === 'INFORMATIONAL'
                ? 'bg-card border-border ring-1 ring-border shadow-xs'
                : 'bg-muted/30 border-border/70 hover:bg-muted/50 hover:border-border'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-[#5F625F] dark:text-muted-foreground font-semibold">Info</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {severityDistribution.informational}
            </div>
          </button>
        </div>
      </section>

      {/* 2. Structured Findings Matrix */}
      <section aria-label="Detailed findings list" className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="bg-card border border-border/70 rounded-2xl p-10 text-center space-y-2">
            <CheckCircle2 className="size-8 text-[#178A68] mx-auto" />
            <div className="text-base font-bold text-foreground">
              No findings under {activeSeverity} severity
            </div>
            <div className="text-xs text-muted-foreground">
              Perimeter signals for {domain} meet hardened hygiene standards for this tier.
            </div>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const config = severityConfigs[finding.severity] || severityConfigs.INFORMATIONAL;
            const IconComp = config.icon;

            return (
              <div
                key={finding.id}
                className="bg-card border border-border/80 hover:border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-[0_2px_8px_rgba(16,24,20,0.045)] dark:shadow-none transition-all"
                style={
                  finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
                    ? { borderTopColor: config.accentColor, borderTopWidth: '3px' }
                    : undefined
                }
              >
                {/* Finding Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase border ${config.badgeClass}`}
                    >
                      <IconComp className="size-3.5" />
                      <span>{config.label}</span>
                    </span>

                    <span className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                      {finding.category}
                    </span>

                    <span className="text-xs font-mono text-muted-foreground/80">
                      Source: {finding.evidenceSource}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('evidence')}
                    className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto focus-ring"
                  >
                    <Terminal className="size-3.5" />
                    <span>View Wire Signal &rarr;</span>
                  </button>
                </div>

                {/* Finding Title */}
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {finding.label}
                </h3>

                {/* Occurrence vs Significance Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* What is Occurring */}
                  <div className="bg-muted/40 dark:bg-muted/30 border border-border/70 rounded-xl p-4 space-y-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5F625F] dark:text-muted-foreground font-semibold">
                      What Was Observed
                    </div>
                    <div className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed">
                      {finding.occurrence}
                    </div>
                  </div>

                  {/* Why It Matters */}
                  {finding.whyItMatters && (
                    <div className="bg-muted/40 dark:bg-muted/30 border border-border/70 rounded-xl p-4 space-y-1.5">
                      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5F625F] dark:text-muted-foreground font-semibold">
                        Architectural Significance
                      </div>
                      <div className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                        {finding.whyItMatters}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
