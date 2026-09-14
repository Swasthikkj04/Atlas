import React from 'react';
import { Network, ArrowRight, Laptop, Cloud, Server, Layers, Cpu } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { IngressHopViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { buildVerifiedArchitectureNodes } from '../../contracts/gx-o-01-overview-composition.contract.ts';

interface ArchitectureSurfaceProps {
  ingressHops?: readonly IngressHopViewModel[];
  onInspectHopEvidence?: (evidenceRef?: string) => void;
  className?: string;
}

const HOP_ROLE_ICONS: Record<string, typeof Cloud> = {
  CLIENT: Laptop,
  EDGE: Cloud,
  GATEWAY: Server,
  APP: Layers,
  HOST: Cpu,
};

export const ArchitectureSurface: React.FC<ArchitectureSurfaceProps> = ({
  ingressHops = [],
  onInspectHopEvidence,
  className = '',
}) => {
  const verifiedNodes = buildVerifiedArchitectureNodes(ingressHops);

  return (
    <section
      aria-labelledby="observed-architecture-title"
      data-testid="gx-observed-architecture"
      className={`rounded-2xl bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border p-6 sm:p-7 space-y-4 shadow-[0_1px_2px_rgba(16,24,20,0.035)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
            OBSERVED ARCHITECTURE
          </span>
          <h3
            id="observed-architecture-title"
            className="text-base sm:text-lg font-display font-semibold text-foreground flex items-center gap-2"
          >
            <Icon icon={Network} size="small" className="text-[#3568C8] dark:text-primary" />
            <span>Observed Ingress Pipeline ({verifiedNodes.length} Verified Layers)</span>
          </h3>
        </div>
      </div>

      <p className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed">
        Ingress topology reconstructed directly from active wire probes, TLS handshakes, and response header telemetry. Unverified hops are never inferred.
      </p>

      {/* Multi-Hop Pipeline Visualizer */}
      <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 overflow-x-auto pb-1">
        {verifiedNodes.map((node, idx) => {
          const IconComponent = HOP_ROLE_ICONS[node.role] || Server;
          const isLast = idx === verifiedNodes.length - 1;

          return (
            <React.Fragment key={node.step}>
              <div
                onClick={() => node.evidenceRef && onInspectHopEvidence?.(node.evidenceRef)}
                className={`flex-1 min-w-[170px] bg-[#FAFAF8] dark:bg-surface-secondary/50 border border-[#EEEEEB] dark:border-border rounded-xl p-3.5 space-y-1.5 transition-all ${
                  node.evidenceRef ? 'hover:border-primary/50 cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                    Hop 0{node.step}
                  </span>
                  <div className="p-1 rounded-md bg-[#EEF4FF] dark:bg-primary/10 text-[#3568C8] dark:text-primary">
                    <Icon icon={IconComponent} size="small" />
                  </div>
                </div>

                <div className="text-xs font-semibold text-foreground truncate">
                  {node.componentName}
                </div>

                <div className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground truncate">
                  {node.label}
                </div>
              </div>

              {!isLast && (
                <div className="hidden md:flex items-center justify-center text-[#5F625F] dark:text-muted-foreground shrink-0">
                  <Icon icon={ArrowRight} size="small" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};

export default ArchitectureSurface;
