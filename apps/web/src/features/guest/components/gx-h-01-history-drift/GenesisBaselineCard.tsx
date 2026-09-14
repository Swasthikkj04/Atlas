import React from 'react';
import { ShieldCheck, Database, Radio, GitCommit, CheckCircle2, Terminal } from 'lucide-react';
import type { GenesisBaselineArtifact } from '../../contracts/gx-h-01-history-drift.contract.ts';

interface GenesisBaselineCardProps {
  artifact: GenesisBaselineArtifact;
}

export const GenesisBaselineCard: React.FC<GenesisBaselineCardProps> = ({ artifact }) => {
  return (
    <section
      aria-label="Genesis Baseline Artifact"
      className="bg-[#FFFFFF] dark:bg-card border-2 border-primary/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_2px_8px_rgba(16,24,20,0.04)] relative overflow-hidden"
    >
      {/* Top Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary/40" />

      {/* 1. Header Bar: Available Now & Snapshot #0 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>01 &bull; Current Observation &bull; Available Now</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
            {artifact.snapshotLabel}
          </h2>
          <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground font-sans">
            Authoritative initial point-in-time understanding for{' '}
            <span className="font-mono text-foreground font-semibold">{artifact.domain}</span>.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authoritative Baseline</span>
          </span>
          <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
            {artifact.formattedTime}
          </span>
        </div>
      </div>

      {/* 2. Key Telemetry Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>Verified Wire Signals</span>
          </span>
          <div className="text-lg font-mono font-bold text-foreground">
            {artifact.verifiedSignalsCount} signals
          </div>
          <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-sans">
            Cryptographic handshake & HTTP wire headers
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-primary" />
            <span>Ingress Perimeter Hops</span>
          </span>
          <div className="text-lg font-mono font-bold text-foreground">
            {artifact.ingressHopsCount} hops verified
          </div>
          <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-sans">
            Client &rarr; Edge &rarr; Gateway &rarr; Internal
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span>Observations Evaluated</span>
          </span>
          <div className="text-lg font-mono font-bold text-foreground">
            {artifact.relevantObservationsCount} findings
          </div>
          <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-sans">
            Perimeter hygiene & transport posture
          </p>
        </div>
      </div>

      {/* 3. Observed Wire Context Summary */}
      {artifact.wireSummary.length > 0 && (
        <div className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-muted/10 border border-[#E5E7EB] dark:border-border space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-primary" />
            <span>Observed Wire Context at Genesis</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            {artifact.wireSummary.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="text-[10px] text-[#5F625F] dark:text-muted-foreground">
                  {item.category}
                </span>
                <div className="text-foreground font-medium truncate">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Epistemic Provenance Integrity Statement */}
      <div className="px-4 py-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-sans text-emerald-900 dark:text-emerald-300 leading-relaxed">
        <strong className="font-semibold">Provenance Guarantee:</strong> {artifact.integrityStatement}
      </div>
    </section>
  );
};
