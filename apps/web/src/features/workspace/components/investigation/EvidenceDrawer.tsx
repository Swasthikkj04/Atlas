import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Layers,
  Database,
} from 'lucide-react';
import type { EvidenceDrawerProps } from './EvidenceDrawer.types';

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  evidenceItem,
  domainName,
  onOpenInvestigation,
  onOpenSnapshot,
  onCopy,
  className = '',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !evidenceItem) {
    return null;
  }

  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (onCopy) {
      onCopy(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const confidenceBadgeColor = {
    HIGH: 'bg-[#EAF7F2] text-[#178A68] border-[#B9E5D6] dark:bg-[#0E3528]/50 dark:text-[#34D399] dark:border-[#178A68]/40',
    MEDIUM: 'bg-[#FFF4E3] text-[#B86F18] border-[#F0D3A5] dark:bg-[#3D2B14]/50 dark:text-[#FBBF24] dark:border-[#B86F18]/40',
    LOW: 'bg-[#FFF0F1] text-[#C24D57] border-[#F0C3C7] dark:bg-[#3E1418]/50 dark:text-[#F87171] dark:border-[#C24D57]/40',
    INCONCLUSIVE: 'bg-[#F4F4F1] text-[#5F625F] border-[#E2E2DD] dark:bg-surface-metadata dark:text-muted-foreground dark:border-border',
  }[evidenceItem.confidence] || 'bg-[#F4F4F1] text-[#5F625F] border-[#E2E2DD]';

  return (
    <div
      data-testid="evidence-drawer"
      className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-[#121212] border-l border-[#E2E2DD] dark:border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-drawer-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E2E2DD] dark:border-border bg-[#FAFAF8] dark:bg-[#181818]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#5F625F] dark:text-muted-foreground" />
          <h2
            id="evidence-drawer-title"
            className="text-sm font-mono font-semibold tracking-tight text-[#1A1A1A] dark:text-foreground"
          >
            Evidence Inspection
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="evidence-drawer-close"
          className="p-1 rounded-md text-[#5F625F] hover:text-[#1A1A1A] dark:text-muted-foreground dark:hover:text-foreground hover:bg-[#E2E2DD]/50 dark:hover:bg-muted/40 transition-colors"
          aria-label="Close evidence drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
        {/* Domain & Target Identity */}
        <div className="flex items-center justify-between text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
          <span>Target: {domainName}</span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${confidenceBadgeColor}`}>
            {evidenceItem.confidence} CONFIDENCE
          </span>
        </div>

        {/* Level 1: Summary */}
        <div data-testid="evidence-level-1" className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
            Level 1 — Summary
          </div>
          <div className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-[#181818] border border-[#E2E2DD] dark:border-border/60">
            <h3 className="font-medium text-[#1A1A1A] dark:text-foreground">{evidenceItem.claim}</h3>
            <p className="mt-1 text-xs text-[#5F625F] dark:text-muted-foreground">
              {evidenceItem.level1Summary}
            </p>
          </div>
        </div>

        {/* Level 2: Architectural Meaning */}
        <div data-testid="evidence-level-2" className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
            Level 2 — Architectural Meaning
          </div>
          <div className="p-3 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border">
            <p className="text-xs text-[#1A1A1A] dark:text-foreground/90 leading-relaxed font-sans">
              {evidenceItem.level2Meaning}
            </p>
          </div>
        </div>

        {/* Level 3: Raw Telemetry */}
        <div data-testid="evidence-level-3" className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              Level 3 — Raw Wire Telemetry
            </div>
            <button
              type="button"
              onClick={() => handleCopy(evidenceItem.rawEvidence, 'raw')}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5F625F] hover:text-[#1A1A1A] dark:text-muted-foreground dark:hover:text-foreground"
            >
              {copiedKey === 'raw' ? (
                <>
                  <Check className="w-3 h-3 text-[#178A68]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-[#0F141C] border border-[#2B3545] text-[#E1E7F0] font-mono text-xs space-y-2 overflow-x-auto">
            <div className="flex items-center justify-between text-[11px] text-[#8C9AA8] border-b border-[#2B3545] pb-1.5">
              <span>Source: {evidenceItem.source}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {evidenceItem.timestamp ? new Date(evidenceItem.timestamp).toLocaleTimeString() : 'Current'}
              </span>
            </div>
            <div className="whitespace-pre-wrap break-all select-all pt-1 font-mono text-[12px] text-[#A6E22E]">
              {evidenceItem.rawEvidence}
            </div>
          </div>
        </div>

        {/* Snapshot Lineage Context */}
        <div className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-[#181818] border border-[#E2E2DD] dark:border-border/60 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[#5F625F] dark:text-muted-foreground font-mono text-[11px]">
            <span>Snapshot Lineage</span>
            <button
              type="button"
              onClick={() => handleCopy(evidenceItem.level3RawTelemetry.snapshotId, 'snap')}
              className="hover:text-[#1A1A1A] dark:hover:text-foreground inline-flex items-center gap-1"
            >
              {copiedKey === 'snap' ? <Check className="w-3 h-3 text-[#178A68]" /> : <Copy className="w-3 h-3" />}
              <span>{evidenceItem.level3RawTelemetry.snapshotId.substring(0, 12)}...</span>
            </button>
          </div>
          {onOpenSnapshot && (
            <button
              type="button"
              onClick={() => onOpenSnapshot(evidenceItem.level3RawTelemetry.snapshotId)}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-[#E2E2DD] dark:border-border bg-white dark:bg-surface-metadata text-[#1A1A1A] dark:text-foreground hover:bg-[#F4F4F1] transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Inspect Baseline Snapshot</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#E2E2DD] dark:border-border bg-[#FAFAF8] dark:bg-[#181818] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => handleCopy(JSON.stringify(evidenceItem, null, 2), 'json')}
          data-testid="evidence-drawer-copy-json"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md border border-[#E2E2DD] dark:border-border bg-white dark:bg-surface-metadata text-[#1A1A1A] dark:text-foreground hover:bg-[#F4F4F1] transition-colors"
        >
          {copiedKey === 'json' ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#178A68]" />
              <span>Evidence Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#5F625F]" />
              <span>Copy JSON</span>
            </>
          )}
        </button>

        {onOpenInvestigation && (
          <button
            type="button"
            onClick={() => onOpenInvestigation()}
            data-testid="evidence-drawer-open-investigation"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-[#1A1A1A] dark:bg-primary text-white dark:text-primary-foreground hover:bg-[#333333] transition-colors shadow-xs"
          >
            <span>Open Investigation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
