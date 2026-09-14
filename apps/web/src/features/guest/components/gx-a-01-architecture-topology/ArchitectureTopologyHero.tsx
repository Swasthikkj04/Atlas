import React from 'react';
import {
  Globe,
  Shield,
  Server,
  Cloud,
  CheckCircle2,
  Lock,
  ArrowDown,
  ChevronRight,
  Network,
  Info,
} from 'lucide-react';
import type {
  TopologyNodeItem,
  TopologyNodeRole,
} from '../../contracts/gx-a-01-architecture-topology.contract.ts';

interface ArchitectureTopologyHeroProps {
  domain: string;
  pipeline: TopologyNodeItem[];
  selectedNodeId: string | null;
  onSelectNode: (node: TopologyNodeItem) => void;
}

function getNodeIcon(role: TopologyNodeRole) {
  switch (role) {
    case 'CLIENT':
      return Globe;
    case 'EDGE':
      return Shield;
    case 'GATEWAY':
      return Server;
    case 'APP':
      return Server;
    case 'CLOUD':
      return Cloud;
    case 'INTERNAL_BOUNDARY':
      return Lock;
    default:
      return Server;
  }
}

export const ArchitectureTopologyHero: React.FC<ArchitectureTopologyHeroProps> = ({
  domain,
  pipeline,
  selectedNodeId,
  onSelectNode,
}) => {
  return (
    <section
      aria-label="Observed ingress architecture"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      {/* 1. Header & Reconstructed Attribution */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <Network className="w-3.5 h-3.5" />
            <span>01 &bull; Observed Ingress Architecture</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground mt-1">
            How requests appear to travel
          </h2>
          <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground mt-1 font-sans">
            Reconstructed from verified DNS, TLS, and HTTP perimeter signals for{' '}
            <span className="font-mono text-foreground font-semibold">{domain}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Telemetry Only</span>
          </span>
        </div>
      </div>

      {/* 2. Visual Ingress Pipeline (Desktop Horizontal / Mobile Vertical) */}
      <div className="space-y-4">
        <div className="hidden lg:grid grid-cols-4 gap-3 items-stretch relative">
          {pipeline.map((node) => {
            const IconComponent = getNodeIcon(node.role);
            const isSelected = selectedNodeId === node.id;
            const isBoundary = node.isBoundary;

            return (
              <React.Fragment key={node.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNode(node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectNode(node);
                    }
                  }}
                  className={`relative flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    isBoundary
                      ? 'bg-[#F9F9F7] dark:bg-muted/30 border-dashed border-[#D5D5CF] dark:border-border text-muted-foreground'
                      : isSelected
                      ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-1 ring-primary shadow-sm'
                      : 'bg-[#FAFAFA] dark:bg-muted/10 border-[#E5E5E0] dark:border-border hover:border-[#C8C8C0] dark:hover:border-border/80'
                  }`}
                >
                  {/* Top Step & Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-background border border-border text-[#5F625F] dark:text-muted-foreground font-medium">
                      {isBoundary ? 'Boundary' : `0${node.step}`}
                    </span>
                    {isBoundary ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Demarcation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#178A68] dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* Icon & Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isBoundary
                            ? 'bg-muted text-muted-foreground'
                            : isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-foreground/5 dark:bg-muted text-foreground'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate font-sans">
                        {node.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans pl-9">
                      {node.subtitle}
                    </p>
                  </div>

                  {/* Protocol / Signal Tag */}
                  <div className="mt-4 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                    <span className="truncate">
                      {node.protocol || (isBoundary ? 'Observation Limit' : 'Encrypted Transit')}
                    </span>
                    {!isBoundary && (
                      <span className="text-primary font-medium flex items-center gap-0.5 text-[10px]">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile / Tablet Vertical Ingress Flow */}
        <div className="lg:hidden space-y-3">
          {pipeline.map((node, idx) => {
            const IconComponent = getNodeIcon(node.role);
            const isSelected = selectedNodeId === node.id;
            const isBoundary = node.isBoundary;

            return (
              <React.Fragment key={node.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNode(node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectNode(node);
                    }
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isBoundary
                      ? 'bg-[#F9F9F7] dark:bg-muted/30 border-dashed border-[#D5D5CF] dark:border-border'
                      : isSelected
                      ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-1 ring-primary'
                      : 'bg-[#FAFAFA] dark:bg-muted/10 border-[#E5E5E0] dark:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isBoundary
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-foreground/5 dark:bg-muted text-foreground'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground">
                            {isBoundary ? 'Boundary' : `Hop 0${node.step}`}
                          </span>
                          {!isBoundary && (
                            <span className="text-[10px] font-mono text-[#178A68] dark:text-emerald-400">
                              &bull; Verified
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{node.title}</h3>
                        <p className="text-xs text-[#5F625F] dark:text-muted-foreground">{node.subtitle}</p>
                      </div>
                    </div>
                    {!isBoundary && (
                      <span className="text-xs font-mono text-primary font-medium flex items-center gap-1">
                        Select <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {idx < pipeline.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/60" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Subtitle Annotation: Verified vs Unobservable */}
      <div className="p-3.5 rounded-xl bg-[#F8F8F6] dark:bg-muted/30 border border-[#EBEBE8] dark:border-border/60 flex items-start gap-2.5 text-xs font-sans text-[#5F625F] dark:text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground font-medium">Ingress Verification Rule:</strong>{' '}
          Solid paths connect only nodes supported by passive DNS, TLS, and HTTP wire telemetry.
          Internal services behind the origin/gateway boundary are not publicly observable.
        </div>
      </div>
    </section>
  );
};
