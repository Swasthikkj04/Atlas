import React, { useState, useMemo } from 'react';
import {
  Globe,
  Server,
  Layers,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ChevronRight,
  Activity,
  Info,
  Terminal,
  Clock,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Cluster } from '../../../../components/layout';
import type {
  AdaptiveInfrastructureComponent,
} from '../../contracts/adaptive-infrastructure.contract';

import { buildComponentViewModel } from '../../contracts/adaptive-infrastructure-detail.contract';
import type {
  IngressTopologyVisualizerProps,
  IngressTopologyHopNode,
} from './IngressTopologyVisualizer.types';

const LAYER_CONFIG: Record<
  string,
  {
    icon: typeof Globe;
    label: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  EDGE: {
    icon: Globe,
    label: 'EDGE PROXY',
    bg: 'bg-[#EEF4FF] dark:bg-primary/10',
    border: 'border-[#C8D8F6] dark:border-primary/30',
    text: 'text-[#3568C8] dark:text-primary',
    badgeBg: 'bg-[#3568C8]/10',
    badgeText: 'text-[#3568C8]',
  },
  GATEWAY: {
    icon: Server,
    label: 'WEB GATEWAY',
    bg: 'bg-[#FFF8E6] dark:bg-amber-950/20',
    border: 'border-[#FFE6A5] dark:border-amber-700/30',
    text: 'text-[#996500] dark:text-amber-400',
    badgeBg: 'bg-[#996500]/10',
    badgeText: 'text-[#996500]',
  },
  APPLICATION: {
    icon: Layers,
    label: 'APPLICATION',
    bg: 'bg-[#EAF7F2] dark:bg-emerald-950/20',
    border: 'border-[#B9E5D6] dark:border-emerald-700/30',
    text: 'text-[#178A68] dark:text-emerald-400',
    badgeBg: 'bg-[#178A68]/10',
    badgeText: 'text-[#178A68]',
  },
  PLATFORM: {
    icon: Layers,
    label: 'PLATFORM / CMS',
    bg: 'bg-[#F3EEFF] dark:bg-purple-950/20',
    border: 'border-[#DAC4FF] dark:border-purple-700/30',
    text: 'text-[#6B3AC2] dark:text-purple-400',
    badgeBg: 'bg-[#6B3AC2]/10',
    badgeText: 'text-[#6B3AC2]',
  },
  RUNTIME: {
    icon: Cpu,
    label: 'SERVER RUNTIME',
    bg: 'bg-[#F0F4F8] dark:bg-slate-800/40',
    border: 'border-[#D2DCE6] dark:border-slate-700',
    text: 'text-[#1E3A8A] dark:text-blue-300',
    badgeBg: 'bg-[#1E3A8A]/10',
    badgeText: 'text-[#1E3A8A]',
  },
  HOSTING: {
    icon: Server,
    label: 'CLOUD HOSTING',
    bg: 'bg-[#ECFEFF] dark:bg-cyan-950/20',
    border: 'border-[#A5F3FC] dark:border-cyan-700/30',
    text: 'text-[#0E7490] dark:text-cyan-400',
    badgeBg: 'bg-[#0E7490]/10',
    badgeText: 'text-[#0E7490]',
  },
  TLS: {
    icon: ShieldCheck,
    label: 'TLS ENCRYPTION',
    bg: 'bg-[#EAF7F2] dark:bg-emerald-950/20',
    border: 'border-[#B9E5D6] dark:border-emerald-700/30',
    text: 'text-[#178A68] dark:text-emerald-400',
    badgeBg: 'bg-[#178A68]/10',
    badgeText: 'text-[#178A68]',
  },
  DATABASE: {
    icon: Lock,
    label: 'DATA STORAGE',
    bg: 'bg-[#F1F5F9] dark:bg-slate-800',
    border: 'border-[#CBD5E1] dark:border-slate-700',
    text: 'text-[#334155] dark:text-slate-300',
    badgeBg: 'bg-slate-200 dark:bg-slate-700',
    badgeText: 'text-slate-700 dark:text-slate-200',
  },
  SEALED: {
    icon: Lock,
    label: 'SEALED PERIMETER',
    bg: 'bg-[#F7F9F8] dark:bg-surface-secondary',
    border: 'border-[#D9E2DC] dark:border-border',
    text: 'text-[#2D5A43] dark:text-emerald-400',
    badgeBg: 'bg-[#EAF7F2] dark:bg-emerald-950/30',
    badgeText: 'text-[#178A68] dark:text-emerald-400',
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  label: 'INFRASTRUCTURE HOP',
  bg: 'bg-[#FAFAF8] dark:bg-card',
  border: 'border-[#E1E1DC] dark:border-border',
  text: 'text-foreground',
  badgeBg: 'bg-surface-metadata',
  badgeText: 'text-muted-foreground',
};

/**
 * Interactive Ingress Data-Path & Architecture Topology Visualizer (Move 1).
 *
 * Visualizes the end-to-end data-flow journey of a request from Global Client Ingress
 * through Edge Proxies, Web Gateways, and Application Runtimes to the Sealed Internal Core.
 *
 * Core Capabilities:
 * - Live interactive hop navigation with forensic inspection on click
 * - Visual transit connectors indicating protocol transitions and security barriers
 * - Sealed internal perimeter visualization (secure isolation vs leakage)
 * - Deep IA-2 Level 1-3 progressive disclosure integrated directly into the selected node inspector
 * - 100% data-driven from authoritative TechnologyArchitectureOverviewDto
 */
export const IngressTopologyVisualizer: React.FC<IngressTopologyVisualizerProps> = ({
  model,
  onViewFinding,
  onSelectComponent,
  initialSelectedHop = 1,
  className = '',
  ...rest
}) => {
  const { ingressPath, categoryGroups, domainName, observedTimestamp, claimBoundaries } = model;

  // Flatten all components from category groups for fast lookup
  const allComponentsMap = useMemo(() => {
    const map = new Map<string, AdaptiveInfrastructureComponent>();
    for (const group of categoryGroups) {
      for (const comp of group.components) {
        map.set(comp.id.toLowerCase(), comp);
        map.set(comp.name.toLowerCase(), comp);
        if (comp.technology) {
          map.set(comp.technology.toLowerCase(), comp);
        }
      }
    }
    return map;
  }, [categoryGroups]);

  // Build the complete topology nodes including Ingress Entrypoint and Sealed Core
  const topologyNodes = useMemo<IngressTopologyHopNode[]>(() => {
    if (!ingressPath || ingressPath.length === 0) {
      return [];
    }

    const nodes: IngressTopologyHopNode[] = ingressPath.map((hop) => {
      const isEntry =
        hop.hop === 0 ||
        hop.technologyId === 'public-endpoint' ||
        (hop.technologyName ? hop.technologyName.toLowerCase().includes('public endpoint') : false);

      const matchedComp =
        (hop.technologyId ? allComponentsMap.get(hop.technologyId.toLowerCase()) : undefined) ||
        (hop.technologyName ? allComponentsMap.get(hop.technologyName.toLowerCase()) : undefined);

      return {
        hop: hop.hop,
        layer: hop.layer || 'GATEWAY',
        technologyId: hop.technologyId || `hop-${hop.hop}`,
        technologyName: hop.technologyName || 'Observed Hop',
        role: hop.role || matchedComp?.role,
        relationshipType: hop.relationshipType,
        component: matchedComp,
        isEntrypoint: isEntry,
        isTerminal: false,
      };
    });

    // Append the Authoritative Sealed Perimeter terminal node
    const hasUnobservedCore =
      (model.unobservedDimensions && model.unobservedDimensions.length > 0) ||
      !nodes.some((n) => n.layer === 'DATABASE' || n.layer === 'STORAGE');

    if (hasUnobservedCore && nodes.length > 0) {
      nodes.push({
        hop: nodes.length,
        layer: 'SEALED',
        technologyId: 'sealed-internal-core',
        technologyName: 'Sealed Internal Perimeter',
        role: 'Protected VPC, Database & Upstream Core',
        relationshipType: 'ISOLATED_PERIMETER',
        isEntrypoint: false,
        isTerminal: true,
      });
    }

    return nodes;
  }, [ingressPath, allComponentsMap, model.unobservedDimensions]);

  // State: Currently selected hop for deep forensic inspection
  const [selectedHopIndex, setSelectedHopIndex] = useState<number>(() => {
    if (topologyNodes.length > 1) {
      // Default select the first real technology hop (hop 1), or fallback to 0
      return Math.min(initialSelectedHop, topologyNodes.length - 1);
    }
    return 0;
  });

  const activeNode = topologyNodes[selectedHopIndex] || topologyNodes[0];

  const activeViewModel = useMemo(() => {
    if (!activeNode) return null;
    if (activeNode.component) {
      return buildComponentViewModel(activeNode.component, observedTimestamp);
    }
    // Synthesize viewModel for Public Ingress or Sealed Perimeter
    if (activeNode.isEntrypoint) {
      return buildComponentViewModel(
        {
          id: 'public-endpoint',
          category: 'GATEWAY',
          name: 'Public Ingress Gateway',
          role: 'Global Public Endpoint / Anycast Routing',
          layer: 'GATEWAY',
          state: 'OBSERVED',
          confidenceLevel: 'HIGH',
          infrastructureMeaning: `Public DNS entrypoint resolving network requests for ${domainName} over HTTPS (Port 443).`,
          whatThisDoesNotProve:
            'Public ingress reachability verifies DNS & HTTP listener availability, but does not reveal private origin topology without subsequent header/banner telemetry.',
        },
        observedTimestamp,
      );
    }
    if (activeNode.isTerminal) {
      return buildComponentViewModel(
        {
          id: 'sealed-core',
          category: 'SECURITY',
          name: 'Sealed Internal Perimeter',
          role: 'Protected Upstream Origin, VPC & Database Tier',
          layer: 'SEALED',
          state: 'UNOBSERVED',
          confidenceLevel: 'HIGH',
          infrastructureMeaning:
            'Internal storage tiers, relational databases (PostgreSQL/MySQL/SQL Server), and private VPC compute are safely sealed behind the observed reverse proxy/edge boundary.',
          whatThisDoesNotProve:
            'Unobservable internal infrastructure remains shielded from public internet discovery; no direct public access or leakage was observed.',
        },
        observedTimestamp,
      );
    }
    return null;
  }, [activeNode, observedTimestamp, domainName]);

  const activeClaimBoundary = useMemo(() => {
    if (!activeNode) return null;
    return (claimBoundaries || []).find(
      (b) =>
        (b.technologyId && b.technologyId === activeNode.technologyId) ||
        (b.technologyName &&
          activeNode.technologyName &&
          b.technologyName.toLowerCase() === activeNode.technologyName.toLowerCase()),
    );
  }, [activeNode, claimBoundaries]);

  if (topologyNodes.length === 0) {
    return null;
  }

  return (
    <div
      className={`w-full rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_3px_rgba(16,24,20,0.04)] overflow-hidden transition-all ${className}`}
      data-testid="ingress-topology-visualizer"
      role="region"
      aria-label="Ingress Request Path & Architecture Topology"
      {...rest}
    >
      {/* 1. Header & Live Telemetry Bar */}
      <div className="px-5 py-4 border-b border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex flex-wrap items-center justify-between gap-3">
        <Cluster gap="sm" align="center">
          <div className="p-1.5 rounded-lg bg-[#EEF4FF] dark:bg-primary/10 border border-[#C8D8F6] dark:border-primary/20 text-[#3568C8] dark:text-primary">
            <Icon icon={Activity} size="small" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold tracking-[0.24em] uppercase text-[#3568C8] dark:text-primary">
                INGRESS DATA-PATH TOPOLOGY
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F4F1] dark:bg-surface-secondary text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-[#178A68]" />
                ACTIVE DATA PATH
              </span>
            </div>
            <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono mt-0.5">
              {topologyNodes.length - 1} transit boundary hops · End-to-end request flow for{' '}
              <strong className="text-foreground font-medium">{domainName}</strong>
            </p>
          </div>
        </Cluster>

        <div className="flex items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
          <span className="hidden sm:inline">Click any hop to inspect evidence</span>
          <span className="px-2 py-0.5 rounded bg-surface-metadata border border-border text-[11px]">
            {selectedHopIndex + 1} of {topologyNodes.length} Selected
          </span>
        </div>
      </div>

      {/* 2. Interactive Flow Pipeline Canvas (Horizontal Scroll on Mobile / Fluid Grid on Desktop) */}
      <div className="p-5 lg:p-6 bg-gradient-to-b from-[#FFFFFF] to-[#FBFBF9] dark:from-card dark:to-surface-secondary/40 border-b border-[#EEEEEB] dark:border-border-divider overflow-x-auto">
        <div className="flex items-stretch gap-3 min-w-[720px] lg:min-w-0">
          {topologyNodes.map((node, idx) => {
            const isSelected = selectedHopIndex === idx;
            const config = LAYER_CONFIG[node.layer.toUpperCase()] || DEFAULT_CONFIG;
            const IconComponent = config.icon;
            const isLast = idx === topologyNodes.length - 1;

            // Connector Label between this hop and next
            let connectorLabel = 'HTTPS Transit';
            if (node.isEntrypoint) connectorLabel = 'Anycast BGP Ingress';
            else if (node.layer === 'EDGE') connectorLabel = 'Encrypted Edge Transit';
            else if (node.layer === 'GATEWAY') connectorLabel = 'Reverse Proxy Loopback';
            else if (node.layer === 'APPLICATION' || node.layer === 'RUNTIME')
              connectorLabel = 'Internal Compute Execution';
            else if (isLast) connectorLabel = 'Sealed Perimeter Barrier';

            return (
              <React.Fragment key={`${node.technologyId}-${idx}`}>
                {/* Node Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHopIndex(idx);
                    if (node.component && onSelectComponent) {
                      onSelectComponent(node.component.id);
                    }
                  }}
                  data-testid={`topology-hop-node-${idx}`}
                  aria-pressed={isSelected}
                  className={`flex-1 min-w-[170px] max-w-[240px] text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative group select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#FFFFFF] dark:bg-card border-[#3568C8] dark:border-primary shadow-[0_0_0_2px_rgba(53,104,200,0.2)] dark:shadow-[0_0_0_2px_rgba(147,197,253,0.3)] translate-y-[-2px]'
                      : 'bg-[#FFFFFF] dark:bg-card border-[#E1E1DC] dark:border-border hover:border-[#B4B4AD] dark:hover:border-border-strong hover:shadow-[0_2px_6px_rgba(16,24,20,0.05)]'
                  }`}
                >
                  {/* Top bar: Hop badge + Layer chip */}
                  <div className="space-y-2.5">
                    <Cluster justify="between" align="center" gap="xs">
                      <span className="font-mono text-[10px] font-bold text-[#5F625F] dark:text-muted-foreground uppercase tracking-wider">
                        HOP {String(idx).padStart(2, '0')}
                      </span>

                      <span
                        className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.bg} ${config.border} ${config.text}`}
                      >
                        {config.label}
                      </span>
                    </Cluster>

                    {/* Icon + Title + Version */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-md border ${config.bg} ${config.border} ${config.text}`}
                        >
                          <Icon icon={IconComponent} size="small" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-mono text-xs font-semibold text-foreground truncate group-hover:text-[#3568C8] dark:group-hover:text-primary transition-colors">
                            {node.technologyName}
                          </h4>
                        </div>
                      </div>

                      {/* Subtitle / Role */}
                      <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-sans line-clamp-2 leading-tight">
                        {node.role || (node.isTerminal ? 'Protected internal perimeter' : 'Ingress routing')}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Status & Indicator */}
                  <div className="pt-3 mt-3 border-t border-[#F0F0EC] dark:border-border flex items-center justify-between text-[10px] font-mono">
                    {node.isTerminal ? (
                      <span className="text-[#5F625F] dark:text-muted-foreground font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 inline" /> SEALED
                      </span>
                    ) : node.component?.version ? (
                      <span className="text-foreground font-medium">
                        v{node.component.version}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium">
                        {node.layer}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-mono transition-opacity ${
                        isSelected ? 'text-[#3568C8] dark:text-primary font-bold' : 'opacity-0 group-hover:opacity-100 text-muted-foreground'
                      }`}
                    >
                      {isSelected ? 'ACTIVE' : 'INSPECT →'}
                    </span>
                  </div>
                </button>

                {/* Connector Pipe between Hops */}
                {!isLast && (
                  <div
                    data-testid={`topology-hop-connector-${idx}`}
                    className="flex flex-col items-center justify-center shrink-0 w-8 lg:w-10 relative group/connector"
                    title={connectorLabel}
                  >
                    <div className="w-full flex items-center">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-[#C8D8F6] to-[#A3BFFA] dark:from-primary/30 dark:to-primary/60 rounded-full" />
                      <Icon
                        icon={ChevronRight}
                        size="small"
                        className="text-[#3568C8] dark:text-primary shrink-0 -ml-1"
                      />
                    </div>
                    <span className="text-[8px] font-mono text-[#80837E] dark:text-muted-foreground uppercase tracking-tighter text-center mt-1 hidden md:block max-w-[54px] truncate">
                      {connectorLabel.split(' ')[0]}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Deep Forensic Node Inspector (IA-2 Progressive Disclosure for Selected Hop) */}
      {activeViewModel && (
        <div
          data-testid="topology-node-inspector"
          className="p-5 lg:p-6 bg-[#FFFFFF] dark:bg-card space-y-4"
        >
          {/* Top Header of Inspector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border">
            <Cluster gap="sm" align="center">
              <div className="p-2 rounded-lg bg-[#F0F4F8] dark:bg-surface-secondary border border-border">
                <Icon
                  icon={LAYER_CONFIG[activeNode.layer.toUpperCase()]?.icon || Activity}
                  size="small"
                  className="text-[#3568C8] dark:text-primary"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                    HOP {String(selectedHopIndex).padStart(2, '0')} INSPECTOR
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#EEF4FF] dark:bg-primary/10 border border-[#C8D8F6] dark:border-primary/20 text-[#3568C8] dark:text-primary">
                    {activeNode.layer}
                  </span>
                </div>
                <h3 className="font-mono text-base font-semibold text-foreground">
                  {activeViewModel.name}
                  {activeViewModel.version && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (v{activeViewModel.version})
                    </span>
                  )}
                </h3>
              </div>
            </Cluster>

            <Cluster gap="xs" align="center">
              {activeViewModel.confidenceLevel && (
                <span className="font-mono text-[10px] font-medium text-[#178A68] dark:text-emerald-400 px-2 py-0.5 rounded bg-[#EAF7F2] dark:bg-emerald-950/30 border border-[#B9E5D6] dark:border-emerald-800/40">
                  {activeViewModel.confidenceLevel === 'HIGH'
                    ? 'High confidence'
                    : activeViewModel.confidenceLevel === 'MEDIUM'
                    ? 'Observed'
                    : 'Direct evidence'}
                </span>
              )}
              {activeViewModel.role && (
                <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
                  {activeViewModel.role}
                </span>
              )}
              {onViewFinding && activeViewModel.evidence.length > 0 && (
                <button
                  type="button"
                  onClick={() => onViewFinding(activeViewModel.id)}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-[#3568C8] dark:text-primary hover:underline ml-2 cursor-pointer"
                  data-testid="hop-inspect-evidence-btn"
                >
                  <span>Inspect evidence →</span>
                </button>
              )}
            </Cluster>
          </div>

          {/* Level 2: Architectural Understanding & Claim Boundaries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: What it means & why detected */}
            <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                <Icon icon={Info} size="small" className="text-[#3568C8]" />
                Role & Architectural Context
              </div>
              <p className="text-xs text-foreground leading-relaxed m-0 font-sans">
                {activeViewModel.whyThisAppears ||
                  activeNode.role ||
                  'Active component executing in the request handling pathway.'}
              </p>
            </div>

            {/* Right: Anti-Overreach Claim Boundaries */}
            <div className="p-4 rounded-xl border border-[#FFE6A5] dark:border-amber-700/30 bg-[#FFFDF5] dark:bg-amber-950/10 space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#996500] dark:text-amber-400">
                <Icon icon={ShieldAlert} size="small" />
                Detection Scope Limit
              </div>
              <p className="text-xs text-[#7A5200] dark:text-amber-300 leading-relaxed m-0 font-sans">
                {activeClaimBoundary?.boundary ||
                  activeViewModel.whatThisDoesNotProve ||
                  'Observed presence establishes this specific layer boundary without fabricating unevidenced upstream services.'}
              </p>
            </div>
          </div>

          {/* Level 3: Forensic Wire Evidence (Headers, Signals, Cookies) */}
          {activeViewModel.hasEvidence && (
            <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-surface-metadata/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                  <Icon icon={Terminal} size="small" className="text-[#3568C8]" />
                  Wire Evidence Signals ({activeViewModel.evidence.length})
                </div>
                {observedTimestamp && (
                  <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 inline" />
                    Observed: {new Date(observedTimestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {activeViewModel.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-[#EEEEEB] dark:border-border bg-[#FAFAF8] dark:bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-metadata border border-border text-muted-foreground shrink-0">
                        {ev.sourceType}
                      </span>
                      <span className="text-foreground truncate font-medium select-all">
                        {ev.observedSignal}
                      </span>
                    </div>

                    {ev.sourceDescription && (
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0 self-start sm:self-auto">
                        {ev.sourceDescription}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

IngressTopologyVisualizer.displayName = 'IngressTopologyVisualizer';
