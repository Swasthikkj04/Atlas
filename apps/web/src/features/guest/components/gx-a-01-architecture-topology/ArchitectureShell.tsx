import React, { useState, useMemo } from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import type {
  GuestWorkspaceViewModel,
  GuestWorkspaceTabId,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import {
  buildObservedIngressPipeline,
  synthesizeArchitectureInterpretation,
  groupCategorizedArchitectureComponents,
  getCanonicalKnowledgeBoundaries,
} from '../../contracts/gx-a-01-architecture-topology.contract.ts';

import { ArchitectureTopologyHero } from './ArchitectureTopologyHero.tsx';
import { ArchitectureNodeInspector } from './ArchitectureNodeInspector.tsx';
import { WhatNebulaUnderstands } from './WhatNebulaUnderstands.tsx';
import { RestrainedComponentMatrix } from './RestrainedComponentMatrix.tsx';
import { KnowledgeBoundaries } from './KnowledgeBoundaries.tsx';

interface ArchitectureShellProps {
  viewModel: GuestWorkspaceViewModel;
  onNavigateTab: (tabId: GuestWorkspaceTabId) => void;
}

export const ArchitectureShell: React.FC<ArchitectureShellProps> = ({
  viewModel,
  onNavigateTab,
}) => {
  const { domain } = viewModel;

  // 1. Reconstruct verified ingress pipeline
  const pipeline = useMemo(
    () => buildObservedIngressPipeline(viewModel),
    [viewModel]
  );

  // 2. Select initial active node (first non-boundary node)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    const defaultNode = pipeline.find((n) => !n.isBoundary && n.role !== 'CLIENT') || pipeline[0];
    return defaultNode ? defaultNode.id : null;
  });

  const selectedNode = useMemo(
    () => pipeline.find((n) => n.id === selectedNodeId) || null,
    [pipeline, selectedNodeId]
  );

  // 3. Synthesize architectural understanding
  const interpretation = useMemo(
    () => synthesizeArchitectureInterpretation(viewModel, pipeline),
    [viewModel, pipeline]
  );

  // 4. Group architecture components
  const componentCategories = useMemo(
    () => groupCategorizedArchitectureComponents(viewModel),
    [viewModel]
  );

  const totalObservedComponents = useMemo(
    () => componentCategories.reduce((acc, cat) => acc + cat.count, 0),
    [componentCategories]
  );

  // 5. Knowledge boundaries
  const knowledgeBoundaries = useMemo(
    () => getCanonicalKnowledgeBoundaries(),
    []
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Session Context Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
          <span className="font-semibold text-foreground">{domain}</span>
          <span>&bull;</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Ephemeral Session</span>
          </span>
        </div>

        <div className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
          Public perimeter understanding &bull; No account required
        </div>
      </div>

      {/* 01: Observed Ingress Architecture (Hero) */}
      <ArchitectureTopologyHero
        domain={domain}
        pipeline={pipeline}
        selectedNodeId={selectedNodeId}
        onSelectNode={(node) => setSelectedNodeId(node.id)}
      />

      {/* 01.5: Node Selection Inspector (Contextual Diagnostic) */}
      {selectedNode && !selectedNode.isBoundary && (
        <ArchitectureNodeInspector
          selectedNode={selectedNode}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 02: What Nebula Understands (Meaning Layer) */}
      <WhatNebulaUnderstands
        domain={domain}
        headline={interpretation.headline}
        narrative={interpretation.narrative}
      />

      {/* 03: Architecture Components (Restrained List) */}
      <RestrainedComponentMatrix
        categories={componentCategories}
        totalCount={totalObservedComponents}
        onNavigateTab={onNavigateTab}
      />

      {/* 04: Unobservable Dimensions (Epistemic Limits) */}
      <KnowledgeBoundaries boundaries={knowledgeBoundaries} />

      {/* 05: Bottom Evidence Navigation Bar */}
      <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
            <Terminal className="w-4 h-4 text-primary" />
            <span>05 &bull; Inspect Verified Signals</span>
          </div>
          <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans">
            Inspect raw cryptographic certificates, DNS records, and HTTP header evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('evidence')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm shrink-0"
        >
          <span>Inspect verified signals</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
