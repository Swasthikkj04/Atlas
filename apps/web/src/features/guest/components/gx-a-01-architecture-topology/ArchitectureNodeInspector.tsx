import React from 'react';
import {
  ShieldCheck,
  Terminal,
  ArrowUpRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import type { TopologyNodeItem } from '../../contracts/gx-a-01-architecture-topology.contract.ts';
import type { GuestWorkspaceTabId } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';

interface ArchitectureNodeInspectorProps {
  selectedNode: TopologyNodeItem | null;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
}

export const ArchitectureNodeInspector: React.FC<ArchitectureNodeInspectorProps> = ({
  selectedNode,
  onNavigateTab,
}) => {
  if (!selectedNode || selectedNode.isBoundary) {
    return null;
  }

  return (
    <div className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)] animate-in fade-in duration-200">
      {/* 1. Inspector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Topology Node Inspector &bull; Why This Appears</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h3 className="text-xl font-display font-semibold tracking-tight text-foreground">
              {selectedNode.title}
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {selectedNode.subtitle}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('evidence')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors border border-primary/20 shrink-0"
        >
          <span>Inspect verified signals</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Three Diagnostic Pillars: Verified Signal, Confidence, Why It Appears */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Verified Signal */}
        <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-muted/20 border border-[#EBEBE8] dark:border-border space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-[#5F625F] dark:text-muted-foreground font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Verified Signal</span>
          </div>
          <div className="font-mono text-xs text-foreground bg-background p-2 rounded border border-border/80 break-all">
            {selectedNode.wireSignal || selectedNode.protocol || 'Active Wire Telemetry'}
          </div>
          <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground">
            Extracted directly from passive handshake and HTTP transit headers.
          </p>
        </div>

        {/* Confidence */}
        <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-muted/20 border border-[#EBEBE8] dark:border-border space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-[#5F625F] dark:text-muted-foreground font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#178A68] dark:text-emerald-400" />
            <span>Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#EAF7F2] text-[#178A68] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#B9E5D6] dark:border-emerald-800/60">
              {selectedNode.confidence || 'HIGH'} Confidence
            </span>
          </div>
          <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground">
            Backed by reproducible cryptographic and protocol wire proof.
          </p>
        </div>

        {/* Why It Appears */}
        <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-muted/20 border border-[#EBEBE8] dark:border-border space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-[#5F625F] dark:text-muted-foreground font-semibold">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>Why It Appears</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed font-sans">
            {selectedNode.whyItAppears}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('evidence')}
              className="text-[11px] font-mono text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{selectedNode.evidenceCount} signals &rarr; View evidence</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
