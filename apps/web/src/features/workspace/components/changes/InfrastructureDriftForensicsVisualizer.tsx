import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  CheckCircle2,
  Info,
  ExternalLink,
  Activity,
  Terminal,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Cluster } from '../../../../components/layout';
import type {
  InfrastructureDriftForensicsVisualizerProps,
  TopologyDriftNode,
  DriftNodeType,
} from './InfrastructureDriftForensicsVisualizer.types';


const DRIFT_CONFIG: Record<
  DriftNodeType,
  {
    icon: typeof Activity;
    badgeLabel: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    borderActive: string;
  }
> = {
  ADDED: {
    icon: PlusCircle,
    badgeLabel: '+ ADDED',
    bg: 'bg-[#EAF7F2] dark:bg-emerald-950/20',
    border: 'border-[#B9E5D6] dark:border-emerald-700/30',
    text: 'text-[#178A68] dark:text-emerald-400',
    badgeBg: 'bg-[#178A68]/15 text-[#178A68] dark:text-emerald-300',
    badgeText: 'text-[#178A68]',
    borderActive: 'border-[#178A68] shadow-[0_0_0_2px_rgba(23,138,104,0.2)]',
  },
  REMOVED: {
    icon: MinusCircle,
    badgeLabel: '- REMOVED',
    bg: 'bg-[#FFF1F2] dark:bg-rose-950/20',
    border: 'border-[#FECDD3] dark:border-rose-700/30',
    text: 'text-[#BE123C] dark:text-rose-400',
    badgeBg: 'bg-[#BE123C]/15 text-[#BE123C] dark:text-rose-300',
    badgeText: 'text-[#BE123C]',
    borderActive: 'border-[#BE123C] shadow-[0_0_0_2px_rgba(190,18,60,0.2)]',
  },
  MODIFIED: {
    icon: RefreshCw,
    badgeLabel: 'Δ MODIFIED',
    bg: 'bg-[#FFF8E6] dark:bg-amber-950/20',
    border: 'border-[#FFE6A5] dark:border-amber-700/30',
    text: 'text-[#996500] dark:text-amber-400',
    badgeBg: 'bg-[#996500]/15 text-[#996500] dark:text-amber-300',
    badgeText: 'text-[#996500]',
    borderActive: 'border-[#996500] shadow-[0_0_0_2px_rgba(153,101,0,0.2)]',
  },
  STABLE: {
    icon: CheckCircle2,
    badgeLabel: '✓ STABLE',
    bg: 'bg-[#FAFAF8] dark:bg-surface-secondary',
    border: 'border-[#E1E1DC] dark:border-border',
    text: 'text-[#5F625F] dark:text-muted-foreground',
    badgeBg: 'bg-surface-metadata text-muted-foreground',
    badgeText: 'text-muted-foreground',
    borderActive: 'border-[#3568C8] shadow-[0_0_0_2px_rgba(53,104,200,0.2)]',
  },
};

/**
 * Real-Time Infrastructure Drift & Change Forensics Visualizer (Move 3).
 *
 * Explains: "How did the verified architecture topology and wire characteristics drift across snapshots?"
 *
 * Capabilities:
 * - Compares Baseline vs Target snapshots with visual node states: ADDED, REMOVED, MODIFIED, STABLE.
 * - Displays exact wire attribute mutations (e.g. NGINX 1.22 -> 1.24, SSL cipher upgrade, header parameterization).
 * - Deep forensic drift inspector for interactive root-cause investigation.
 * - Zero heuristic guessing; 100% verified backend comparison lineage.
 */
export const InfrastructureDriftForensicsVisualizer: React.FC<
  InfrastructureDriftForensicsVisualizerProps
> = ({
  comparisonResult,
  onInvestigateChange,
  className = '',
}) => {
  const { baseSnapshot, targetSnapshot, changes, unchangedComponents } =
    comparisonResult;


  // Build drift nodes by reconciling verified changes and unchanged components
  const driftNodes = useMemo<TopologyDriftNode[]>(() => {
    const nodes: TopologyDriftNode[] = [];

    // Map all changes into drift nodes
    for (const change of changes) {
      let driftType: DriftNodeType = 'MODIFIED';
      if (change.changeType === 'ADDED') driftType = 'ADDED';
      else if (change.changeType === 'REMOVED') driftType = 'REMOVED';

      nodes.push({
        id: change.changeId,
        name: change.title || change.categoryLabel || change.category,
        layer: (change.categoryLabel || change.category || 'INFRASTRUCTURE').toUpperCase(),
        driftType,
        role: change.impactNarrative || `${change.categoryLabel || change.category} Component`,
        baseValue: change.previousValue ?? undefined,
        targetValue: change.currentValue ?? undefined,
        description: change.significanceExplanation || change.summaryNarrative,
        severity: change.severity === 'INFORMATIONAL' ? 'INFO' : (change.severity as any),
        evidenceBefore: [],
        evidenceAfter: [],
        changeStory: change,
      });

    }

    // Map unchanged components as STABLE nodes
    for (const rawComp of unchangedComponents) {
      const comp = typeof rawComp === 'string' ? { id: rawComp, name: rawComp, layer: 'INFRASTRUCTURE', role: 'Unchanged verified component', version: undefined } : (rawComp as any);
      nodes.push({
        id: comp.id || comp.name,
        name: comp.name,
        layer: comp.layer || comp.category || 'INFRASTRUCTURE',
        driftType: 'STABLE',
        role: comp.role || 'Unchanged verified component',
        baseValue: comp.version ? `v${comp.version}` : 'Verified',
        targetValue: comp.version ? `v${comp.version}` : 'Verified',
        description: `${comp.name} remained completely stable with identical wire signatures across both understandings.`,
      });
    }


    // If no nodes, return empty
    if (nodes.length === 0) return [];

    return nodes;
  }, [changes, unchangedComponents]);

  // Active selected drift node for forensic inspection
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);
  const activeNode = driftNodes[selectedNodeIndex] || driftNodes[0];

  // Calculate drift statistics
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    let stable = 0;

    for (const n of driftNodes) {
      if (n.driftType === 'ADDED') added++;
      else if (n.driftType === 'REMOVED') removed++;
      else if (n.driftType === 'MODIFIED') modified++;
      else if (n.driftType === 'STABLE') stable++;
    }

    return { added, removed, modified, stable, totalDrift: added + removed + modified };
  }, [driftNodes]);

  // Elapsed time formatting
  const elapsedTime = useMemo(() => {
    if (!baseSnapshot?.capturedAt || !targetSnapshot?.capturedAt) return null;
    const diffMs = Math.abs(
      new Date(targetSnapshot.capturedAt).getTime() -
        new Date(baseSnapshot.capturedAt).getTime(),
    );
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h delta`;
    return `${hours}h delta`;
  }, [baseSnapshot, targetSnapshot]);

  if (driftNodes.length === 0) {
    return null;
  }

  return (
    <div
      className={`w-full rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_3px_rgba(16,24,20,0.04)] overflow-hidden transition-all ${className}`}
      data-testid="infrastructure-drift-visualizer"
      role="region"
      aria-label="Infrastructure Drift & Change Forensics Visualizer"
    >
      {/* 1. Drift Telemetry & Snapshot Header Bar */}
      <div className="px-5 py-4 border-b border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex flex-wrap items-center justify-between gap-3">
        <Cluster gap="sm" align="center">
          <div className="p-1.5 rounded-lg bg-[#FFF8E6] dark:bg-amber-950/20 border border-[#FFE6A5] dark:border-amber-700/30 text-[#996500] dark:text-amber-400">
            <Icon icon={GitBranch} size="small" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold tracking-[0.24em] uppercase text-[#996500] dark:text-amber-400">
                INFRASTRUCTURE DRIFT FORENSICS
              </span>
              {stats.totalDrift > 0 ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF8E6] dark:bg-amber-950/40 border border-[#FFE6A5] dark:border-amber-700/40 text-[#996500] dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#996500] animate-pulse" />
                  {stats.totalDrift} DRIFT EVENT{stats.totalDrift > 1 ? 'S' : ''} DETECTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF7F2] dark:bg-emerald-950/40 border border-[#B9E5D6] dark:border-emerald-700/40 text-[#178A68] dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 inline" /> 100% TOPOLOGICALLY STABLE
                </span>
              )}
            </div>

            <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono mt-0.5">
              Snapshot {baseSnapshot?.id?.slice(0, 8) || 'Base'} ──► Snapshot{' '}
              {targetSnapshot?.id?.slice(0, 8) || 'Target'}{' '}
              {elapsedTime && <span className="text-foreground">({elapsedTime})</span>}
            </p>
          </div>
        </Cluster>

        {/* Drift Summary Pills */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {stats.modified > 0 && (
            <span className="px-2 py-0.5 rounded bg-[#FFF8E6] border border-[#FFE6A5] text-[#996500] font-semibold">
              {stats.modified} Modified
            </span>
          )}
          {stats.added > 0 && (
            <span className="px-2 py-0.5 rounded bg-[#EAF7F2] border border-[#B9E5D6] text-[#178A68] font-semibold">
              +{stats.added} Added
            </span>
          )}
          {stats.removed > 0 && (
            <span className="px-2 py-0.5 rounded bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] font-semibold">
              -{stats.removed} Removed
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-surface-metadata border border-border text-muted-foreground">
            {stats.stable} Stable
          </span>
        </div>
      </div>

      {/* 2. Interactive Drift Topology Canvas */}
      <div className="p-5 lg:p-6 bg-gradient-to-b from-[#FFFFFF] to-[#FBFBF9] dark:from-card dark:to-surface-secondary/40 border-b border-[#EEEEEB] dark:border-border-divider overflow-x-auto">
        <div className="flex items-stretch gap-3 min-w-[720px] lg:min-w-0">
          {driftNodes.map((node, idx) => {
            const isSelected = selectedNodeIndex === idx;
            const config = DRIFT_CONFIG[node.driftType];
            const IconComponent = config.icon;
            const isLast = idx === driftNodes.length - 1;

            return (
              <React.Fragment key={`${node.id}-${idx}`}>
                {/* Drift Node Card */}
                <button
                  type="button"
                  onClick={() => setSelectedNodeIndex(idx)}
                  data-testid={`drift-node-${idx}`}
                  aria-pressed={isSelected}
                  className={`flex-1 min-w-[170px] max-w-[240px] text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative group select-none flex flex-col justify-between ${
                    isSelected
                      ? `bg-[#FFFFFF] dark:bg-card ${config.borderActive} translate-y-[-2px]`
                      : `bg-[#FFFFFF] dark:bg-card ${config.border} hover:border-[#B4B4AD] dark:hover:border-border-strong hover:shadow-[0_2px_6px_rgba(16,24,20,0.05)]`
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top: Layer + Drift Badge */}
                    <Cluster justify="between" align="center" gap="xs">
                      <span className="font-mono text-[9px] font-bold text-[#5F625F] dark:text-muted-foreground uppercase tracking-wider">
                        {node.layer}
                      </span>

                      <span
                        className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.bg} ${config.border} ${config.badgeText}`}
                      >
                        {config.badgeLabel}
                      </span>
                    </Cluster>

                    {/* Icon + Title */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-md border ${config.bg} ${config.border} ${config.text}`}
                        >
                          <Icon icon={IconComponent} size="small" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`font-mono text-xs font-semibold truncate ${
                              node.driftType === 'REMOVED'
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {node.name}
                          </h4>
                        </div>
                      </div>

                      {/* Role or Value Mutation */}
                      <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-sans line-clamp-2 leading-tight">
                        {node.baseValue && node.targetValue && node.baseValue !== node.targetValue
                          ? `${node.baseValue} ➔ ${node.targetValue}`
                          : node.role || node.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Indicator */}
                  <div className="pt-3 mt-3 border-t border-[#F0F0EC] dark:border-border flex items-center justify-between text-[10px] font-mono">
                    <span
                      className={`font-medium ${
                        node.driftType === 'ADDED'
                          ? 'text-[#178A68]'
                          : node.driftType === 'REMOVED'
                          ? 'text-[#BE123C]'
                          : node.driftType === 'MODIFIED'
                          ? 'text-[#996500]'
                          : 'text-[#5F625F]'
                      }`}
                    >
                      {node.driftType}
                    </span>

                    <span
                      className={`text-[10px] font-mono transition-opacity ${
                        isSelected
                          ? 'text-[#3568C8] dark:text-primary font-bold'
                          : 'opacity-0 group-hover:opacity-100 text-muted-foreground'
                      }`}
                    >
                      {isSelected ? 'ACTIVE' : 'INSPECT →'}
                    </span>
                  </div>
                </button>

                {/* Connector Pipe between Drift Nodes */}
                {!isLast && (
                  <div
                    data-testid={`drift-connector-${idx}`}
                    className="flex flex-col items-center justify-center shrink-0 w-6 lg:w-8 relative"
                  >
                    <div className="w-full flex items-center">
                      <div className="h-[2px] flex-1 bg-[#E1E1DC] dark:bg-border rounded-full" />
                      <Icon
                        icon={ChevronRight}
                        size="small"
                        className="text-muted-foreground shrink-0 -ml-1 opacity-60"
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Deep Forensic Drift Inspector Drawer */}
      {activeNode && (
        <div
          data-testid="drift-node-inspector"
          className="p-5 lg:p-6 bg-[#FFFFFF] dark:bg-card space-y-4"
        >
          {/* Top Header of Inspector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border">
            <Cluster gap="sm" align="center">
              <div
                className={`p-2 rounded-lg border ${
                  DRIFT_CONFIG[activeNode.driftType].bg
                } ${DRIFT_CONFIG[activeNode.driftType].border} ${
                  DRIFT_CONFIG[activeNode.driftType].text
                }`}
              >
                <Icon
                  icon={DRIFT_CONFIG[activeNode.driftType].icon}
                  size="small"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                    DRIFT FORENSIC INSPECTOR
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      DRIFT_CONFIG[activeNode.driftType].bg
                    } ${DRIFT_CONFIG[activeNode.driftType].border} ${
                      DRIFT_CONFIG[activeNode.driftType].badgeText
                    }`}
                  >
                    {activeNode.driftType}
                  </span>
                </div>
                <h3 className="font-mono text-base font-semibold text-foreground">
                  {activeNode.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({activeNode.layer})
                  </span>
                </h3>
              </div>
            </Cluster>

            {activeNode.changeStory && onInvestigateChange && (
              <button
                type="button"
                onClick={() => onInvestigateChange(activeNode.changeStory!.changeId)}
                className="px-3 py-1.5 rounded-lg bg-[#EEF4FF] dark:bg-primary/10 border border-[#C8D8F6] dark:border-primary/20 text-[#3568C8] dark:text-primary font-mono text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E0ECFF] transition-colors cursor-pointer"
                data-testid="inspect-change-button"
              >
                Investigate Change Trace <ExternalLink className="w-3 h-3 inline" />
              </button>
            )}
          </div>

          {/* Level 2: Architectural Impact & Wire Drift Diff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: What changed & operational meaning */}
            <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                <Icon icon={Info} size="small" className="text-[#3568C8]" />
                Drift Significance & Operational Meaning
              </div>
              <p className="text-xs text-foreground leading-relaxed m-0 font-sans">
                {activeNode.description || activeNode.role}
              </p>
            </div>

            {/* Right: Exact Before -> After Mutation Diff */}
            <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                <Icon icon={Terminal} size="small" className="text-[#996500]" />
                Wire Telemetry State Mutation
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded border border-[#EEEEEB] dark:border-border bg-[#FFFFFF] dark:bg-card">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">
                    Previous (Base)
                  </span>
                  <span className="text-foreground font-medium break-all">
                    {activeNode.baseValue || 'Not Observed'}
                  </span>
                </div>
                <div className="p-2.5 rounded border border-[#EEEEEB] dark:border-border bg-[#FFFFFF] dark:bg-card">
                  <span className="text-[9px] uppercase font-bold text-[#3568C8] dark:text-primary block mb-1">
                    Current (Target)
                  </span>
                  <span className="text-foreground font-medium break-all">
                    {activeNode.targetValue || 'Not Observed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

InfrastructureDriftForensicsVisualizer.displayName =
  'InfrastructureDriftForensicsVisualizer';
