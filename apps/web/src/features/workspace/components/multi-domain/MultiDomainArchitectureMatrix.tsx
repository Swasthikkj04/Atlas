import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Layers, Network, Server, Globe } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { MultiDomainArchitectureMatrixData, DomainIngressRow } from '../../contracts/multi-domain-matrix.contract';
import { VendorConcentrationCard } from './VendorConcentrationCard';

export interface MultiDomainArchitectureMatrixProps {
  readonly matrixData: MultiDomainArchitectureMatrixData;
  readonly onSelectDomain: (domainId: string) => void;
  readonly className?: string;
}

export const MultiDomainArchitectureMatrix: React.FC<MultiDomainArchitectureMatrixProps> = ({
  matrixData,
  onSelectDomain,
  className = '',
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ATTENTION' | 'CHANGED'>('ALL');

  if (matrixData.isEmpty || matrixData.rows.length === 0) {
    return (
      <div
        className={`w-full p-8 rounded-2xl border border-dashed border-[#E1E1DC] dark:border-border text-center ${className}`}
        data-testid="multi-domain-matrix-empty"
      >
        <p className="text-sm font-mono text-[#5F625F] dark:text-muted-foreground">
          No domains available to build comparative architecture matrix.
        </p>
      </div>
    );
  }

  const filteredRows = matrixData.rows.filter((row) => {
    if (filter === 'ATTENTION') return row.status === 'ATTENTION' || row.postureScore < 80;
    if (filter === 'CHANGED') return row.status === 'CHANGED';
    return true;
  });

  const getStatusBadge = (status: DomainIngressRow['status']) => {
    switch (status) {
      case 'STABLE':
        return (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#EAF7F2] dark:bg-[#178A68]/15 text-[#178A68] border border-[#B9E5D6] dark:border-[#178A68]/30">
            Stable
          </span>
        );
      case 'ATTENTION':
        return (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#FFF4E3] dark:bg-[#B86F18]/15 text-[#B86F18] border border-[#F0D3A5] dark:border-[#B86F18]/30">
            Attention
          </span>
        );
      case 'CHANGED':
        return (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-secondary text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border">
            Changed
          </span>
        );
      case 'VERIFYING':
        return (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#EEF4FF] dark:bg-[#3568C8]/15 text-[#3568C8] border border-[#C8D8F6] dark:border-[#3568C8]/30">
            Verifying
          </span>
        );
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6] dark:bg-[#178A68]/15 dark:border-[#178A68]/30';
    if (score >= 75) return 'text-[#B86F18] bg-[#FFF4E3] border-[#F0D3A5] dark:bg-[#B86F18]/15 dark:border-[#B86F18]/30';
    return 'text-[#C24D57] bg-[#FFF0F1] border-[#F0C3C7] dark:bg-[#C24D57]/15 dark:border-[#C24D57]/30';
  };

  return (
    <div
      className={`w-full flex flex-col gap-6 ${className}`}
      data-testid="multi-domain-architecture-matrix"
    >
      {/* 1. Portfolio & Vendor Concentration Analytics Card */}
      <VendorConcentrationCard
        fleetPosture={matrixData.fleetPosture}
        concentrations={matrixData.concentrations}
      />

      {/* 2. Side-by-Side Ingress Topology Comparison Table */}
      <div className="w-full rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E1E1DC] dark:border-border/60">
          <div>
            <h3 className="text-base font-serif font-medium text-foreground">
              Cross-Domain Ingress & Architecture Matrix
            </h3>
            <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground mt-0.5">
              Side-by-side delivery topologies from public edge to runtime
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E1E1DC] dark:border-border text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-[#5F625F] dark:text-muted-foreground hover:text-foreground'
              }`}
              data-testid="filter-all-domains"
            >
              All ({matrixData.rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('ATTENTION')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'ATTENTION'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-[#5F625F] dark:text-muted-foreground hover:text-foreground'
              }`}
              data-testid="filter-attention-domains"
            >
              Attention
            </button>
            <button
              type="button"
              onClick={() => setFilter('CHANGED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'CHANGED'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-[#5F625F] dark:text-muted-foreground hover:text-foreground'
              }`}
              data-testid="filter-changed-domains"
            >
              Changed
            </button>
          </div>
        </div>

        {/* Rows Container */}
        <div className="divide-y divide-[#E1E1DC] dark:divide-border/60">
          {filteredRows.map((row) => (
            <div
              key={row.domainId}
              className="py-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAFAF8]/60 dark:hover:bg-surface-secondary/20 transition-colors rounded-xl px-2 -mx-2"
              data-testid={`matrix-row-${row.domainId}`}
            >
              {/* Domain Identity & Status */}
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
                    <Icon icon={Globe} size="small" />
                  </span>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {row.domainName}
                  </span>
                  {getStatusBadge(row.status)}
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <div
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold ${getScoreBadge(row.postureScore)}`}
                  >
                    Score: {row.postureScore}
                  </div>
                  {row.criticalAnomalyCount > 0 && (
                    <span className="text-[10px] font-mono text-[#C24D57] dark:text-[#FF6B6B]">
                      {row.criticalAnomalyCount} critical risk
                    </span>
                  )}
                </div>
              </div>

              {/* Ingress Delivery Chain */}
              <div className="flex-1 overflow-x-auto py-1">
                <div className="flex items-center gap-2 min-w-max text-xs font-mono">
                  {/* Step 1: Edge Provider */}
                  <div className="px-2.5 py-1.5 rounded-lg border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary flex items-center gap-1.5">
                    <Icon icon={Network} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
                    <span className="font-medium text-foreground">{row.edgeTechnology}</span>
                  </div>

                  <span className="text-[#5F625F]/50 dark:text-muted-foreground/50">
                    <Icon icon={ChevronRight} size="small" />
                  </span>

                  {/* Step 2: Gateway */}
                  <div className="px-2.5 py-1.5 rounded-lg border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary flex items-center gap-1.5">
                    <Icon icon={Server} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
                    <span className="font-medium text-foreground">{row.gatewayTechnology}</span>
                  </div>

                  <span className="text-[#5F625F]/50 dark:text-muted-foreground/50">
                    <Icon icon={ChevronRight} size="small" />
                  </span>

                  {/* Step 3: Application & Runtime */}
                  <div className="px-2.5 py-1.5 rounded-lg border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary flex items-center gap-1.5">
                    <Icon icon={Layers} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
                    <span className="font-medium text-foreground">{row.applicationRuntime}</span>
                  </div>
                </div>
              </div>

              {/* Action Jump Button */}
              <button
                type="button"
                onClick={() => onSelectDomain(row.domainId)}
                className="self-end lg:self-center px-3 py-1.5 rounded-lg border border-[#E1E1DC] dark:border-border hover:bg-[#FAFAF8] dark:hover:bg-surface-secondary text-xs font-mono text-foreground flex items-center gap-1.5 transition-colors"
                data-testid={`inspect-domain-btn-${row.domainId}`}
              >
                <span>Inspect</span>
                <Icon icon={ArrowRight} size="small" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
