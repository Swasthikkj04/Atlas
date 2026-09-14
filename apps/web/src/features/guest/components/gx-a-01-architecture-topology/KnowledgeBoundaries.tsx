import React from 'react';
import { ShieldAlert, Database, Network, KeyRound, Lock, Info } from 'lucide-react';
import type { KnowledgeBoundaryItem } from '../../contracts/gx-a-01-architecture-topology.contract.ts';

interface KnowledgeBoundariesProps {
  boundaries: readonly KnowledgeBoundaryItem[];
}

function getBoundaryIcon(id: string) {
  switch (id) {
    case 'kb-internal-services':
      return Lock;
    case 'kb-database-storage':
      return Database;
    case 'kb-network-topology':
      return Network;
    case 'kb-identity-access':
      return KeyRound;
    default:
      return ShieldAlert;
  }
}

export const KnowledgeBoundaries: React.FC<KnowledgeBoundariesProps> = ({
  boundaries,
}) => {
  return (
    <section
      aria-label="Unobservable dimensions"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      {/* 1. Header & Knowledge Boundary Distinction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>04 &bull; Unobservable Dimensions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground mt-1">
            What public telemetry cannot establish
          </h2>
          <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground mt-0.5">
            Knowledge boundaries — not vulnerabilities or architectural findings.
          </p>
        </div>

        <span className="text-xs font-mono font-medium text-amber-800 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 self-start sm:self-auto">
          Epistemic Limits
        </span>
      </div>

      {/* 2. Four Canonical Knowledge Boundary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boundaries.map((item) => {
          const IconComponent = getBoundaryIcon(item.id);

          return (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-xl bg-[#FAFAFA] dark:bg-muted/15 border border-[#EBEBE8] dark:border-border space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground font-sans">
                    {item.title}
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                  {item.telemetryScope}
                </span>
              </div>

              <p className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed font-sans pl-9">
                {item.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Epistemic Principle Note */}
      <div className="p-3.5 rounded-xl bg-[#F8F8F6] dark:bg-muted/30 border border-[#EBEBE8] dark:border-border/60 flex items-start gap-2.5 text-xs font-sans text-[#5F625F] dark:text-muted-foreground">
        <Info className="w-4 h-4 text-[#3568C8] dark:text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground font-medium">Epistemic Truth:</strong>{' '}
          Nebula does not fabricate database schemas, Kubernetes pod topology, or IAM configurations.
          Public perimeter telemetry stops at verified endpoints.
        </div>
      </div>
    </section>
  );
};
