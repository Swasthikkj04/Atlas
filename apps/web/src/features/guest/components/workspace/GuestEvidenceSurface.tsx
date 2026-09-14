import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Terminal,
  Copy,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { DomainFavicon } from '../../../workspace/components/identity/DomainFavicon';
import type {
  GuestWorkspaceViewModel,
  EvidenceRecordViewModel,
  GuestObservationViewModel,
} from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';

const observationStateColorMap: Record<
  string,
  { badgeClass: string; label: string; icon: LucideIcon }
> = {
  OBSERVED: {
    badgeClass: 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60',
    label: 'Observed',
    icon: CheckCircle2,
  },
  MISSING: {
    badgeClass: 'text-[#B86F18] bg-[#FFF4E3] border-[#F0D3A5] dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60',
    label: 'Missing',
    icon: AlertCircle,
  },
  NON_COMPLIANT: {
    badgeClass: 'text-[#C24D57] bg-[#FFF0F1] border-[#F0C3C7] dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/60',
    label: 'Non-Compliant',
    icon: AlertCircle,
  },
  UNKNOWN: {
    badgeClass: 'text-[#5F625F] bg-[#F4F4F1] border-[#E2E2DD] dark:text-muted-foreground dark:bg-muted dark:border-border',
    label: 'Unknown',
    icon: HelpCircle,
  },
  FAILED: {
    badgeClass: 'text-[#A93442] bg-[#FDEBEC] border-[#E9B3B9] dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/60',
    label: 'Collection Failed',
    icon: XCircle,
  },
};

interface GuestEvidenceSurfaceProps {
  viewModel: GuestWorkspaceViewModel;
}

/**
 * Authoritative Guest Evidence Surface.
 *
 * Implements the exact same two-layer progressive disclosure architecture
 * as the Registered Workspace Evidence Surface (ObservationEvidenceSurface):
 * - Layer 1: Canonical Observed Facts (Observed facts, keys, states, values, timestamps)
 * - Layer 2: Underlying Protocol Evidence Lineage (Cryptographically bound artifacts, on-demand raw disclosure)
 */
export const GuestEvidenceSurface: React.FC<GuestEvidenceSurfaceProps> = ({
  viewModel,
}) => {
  const { domain, observations = [], rawEvidenceRecords = [] } = viewModel;
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedRawIds, setExpandedRawIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique categories across observations & artifacts
  const categories = useMemo(() => {
    const set = new Set<string>();
    observations.forEach((obs) => {
      if (obs.category) set.add(obs.category);
    });
    rawEvidenceRecords.forEach((ev) => {
      if (ev.category) set.add(ev.category);
    });
    return Array.from(set);
  }, [observations, rawEvidenceRecords]);

  // Filtered observations
  const filteredObservations = useMemo(() => {
    if (selectedCategory === 'ALL') return observations;
    return observations.filter(
      (obs) =>
        obs.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        obs.key.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [observations, selectedCategory]);

  // Filtered protocol evidence artifacts
  const filteredEvidence = useMemo(() => {
    if (selectedCategory === 'ALL') return rawEvidenceRecords;
    return rawEvidenceRecords.filter(
      (ev) =>
        ev.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(ev.category?.toLowerCase())
    );
  }, [rawEvidenceRecords, selectedCategory]);

  const toggleRawExpanded = (id: string) => {
    setExpandedRawIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyPayload = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPayload = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <section
        aria-labelledby="evidence-heading-title"
        className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_2px_8px_rgba(16,24,20,0.045)] dark:shadow-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#3568C8] dark:text-primary font-semibold">
              <Cpu className="size-3.5" />
              <span>Evidence &bull; Observation Baseline</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <DomainFavicon domain={domain} size="secondary" />
              <h2
                id="evidence-heading-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
              >
                Authoritative Evidence Lineage
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Underlying observed infrastructure facts and protocol artifacts supporting this intelligence for{' '}
              <span className="font-mono text-foreground font-semibold">{domain}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-muted/60 border border-border/70 text-[#5F625F] dark:text-muted-foreground">
              <span>{observations.length} Observed Facts</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60">
              <ShieldCheck className="size-3.5" />
              <span>SHA-256 Cryptographically Bound</span>
            </span>
          </div>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer focus-ring ${
                selectedCategory === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
              }`}
            >
              All Signals ({observations.length + rawEvidenceRecords.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer focus-ring ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 2. Layer 1: Canonical Observations (Observed Facts) */}
      <section aria-label="Observed Facts" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5F625F] dark:text-muted-foreground font-mono">
            Observed Facts ({filteredObservations.length})
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            Layer 1 &bull; Canonical State Lineage
          </span>
        </div>

        {filteredObservations.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border/80 bg-muted/20 text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              No observations recorded matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredObservations.map((obs: GuestObservationViewModel, idx: number) => {
              const stateConfig =
                observationStateColorMap[obs.state] || observationStateColorMap.UNKNOWN;
              const StateIcon = stateConfig.icon;

              return (
                <div
                  key={`${obs.key}-${idx}`}
                  className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(16,24,20,0.045)] dark:shadow-none space-y-3.5 hover:border-border transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-semibold text-foreground">
                        {obs.key}
                      </span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border self-start sm:self-auto ${stateConfig.badgeClass}`}
                    >
                      <StateIcon className="size-3" />
                      <span>{stateConfig.label}</span>
                    </div>
                  </div>

                  {obs.value && (
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#5F625F] dark:text-muted-foreground mb-1 block font-semibold">
                        Observed Value:
                      </span>
                      <pre className="font-mono text-xs text-foreground bg-muted/40 dark:bg-muted/30 border border-border/70 rounded-xl p-3.5 whitespace-pre-wrap break-all leading-relaxed m-0">
                        {obs.value}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-muted-foreground">
                    <span className="text-primary font-medium">Ref: {obs.evidenceRef}</span>
                    <span>Observed: {new Date(obs.observedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Layer 2: Protocol Evidence Lineage */}
      <section aria-label="Protocol Evidence Lineage" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5F625F] dark:text-muted-foreground font-mono">
            Underlying Protocol Evidence ({filteredEvidence.length})
          </h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            Layer 2 &bull; Cryptographic Wire Artifacts
          </span>
        </div>

        {filteredEvidence.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border/80 bg-muted/20 text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              No protocol evidence artifacts available matching this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvidence.map((artifact: EvidenceRecordViewModel) => {
              const isExpanded = expandedRawIds.has(artifact.id);
              const formattedPayload = formatPayload(artifact.payload);
              const isCopied = copiedId === artifact.id;

              return (
                <div
                  key={artifact.id}
                  className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(16,24,20,0.045)] dark:shadow-none space-y-3.5 hover:border-border transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="size-4 text-[#178A68] dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm font-semibold text-foreground">
                            {artifact.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            &bull; {artifact.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {artifact.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full font-semibold">
                        {artifact.integrityStatus || 'VERIFIED_WIRE'}
                      </span>
                      <span className="font-mono text-[10px] text-[#5F625F] dark:text-muted-foreground border border-border px-2.5 py-0.5 rounded-full bg-muted/60 font-medium">
                        {artifact.collector}
                      </span>
                    </div>
                  </div>

                  {/* Contextual Protocol Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                    {artifact.target && (
                      <div className="p-3 bg-muted/40 dark:bg-muted/30 border border-border/70 rounded-xl">
                        <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block font-mono font-semibold tracking-wider">
                          Target:
                        </span>
                        <span className="font-mono text-[11px] text-foreground break-all mt-0.5 block">
                          {artifact.target}
                        </span>
                      </div>
                    )}
                    {artifact.responseStatus && (
                      <div className="p-3 bg-muted/40 dark:bg-muted/30 border border-border/70 rounded-xl">
                        <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block font-mono font-semibold tracking-wider">
                          Status:
                        </span>
                        <span className="font-mono text-[11px] text-foreground mt-0.5 block">
                          {artifact.responseStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progressive Disclosure Toggle */}
                  <div className="pt-2 border-t border-border/60 space-y-3">
                    <button
                      type="button"
                      onClick={() => toggleRawExpanded(artifact.id)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline font-mono font-medium cursor-pointer transition-colors focus-ring"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                      <span>
                        {isExpanded
                          ? 'Hide Raw Protocol Payload'
                          : 'View Raw Protocol Payload'}
                      </span>
                    </button>

                    {/* Expandable Raw Artifact Payload */}
                    {isExpanded && (
                      <div className="bg-muted/30 border border-border rounded-xl p-4 overflow-x-auto space-y-3 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Terminal className="size-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5F625F] dark:text-muted-foreground font-semibold">
                              Raw Artifact Payload
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[220px]">
                              SHA256: {artifact.verificationHash}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPayload(artifact.id, formattedPayload)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer focus-ring"
                              aria-label="Copy raw payload"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="size-3 text-[#178A68]" />
                                  <span className="text-[#178A68] font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3 text-muted-foreground" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <pre className="font-mono text-[11.5px] text-emerald-400 bg-zinc-950 p-4 rounded-xl whitespace-pre-wrap break-all leading-relaxed m-0 border border-border/40 selection:bg-emerald-500/30 selection:text-white">
                          <code>{formattedPayload}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
