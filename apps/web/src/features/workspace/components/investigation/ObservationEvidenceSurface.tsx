import React, { useState } from 'react';
import {
  ArrowLeft,
  Cpu,
  Layers,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  SectionTitle,
  Body,
  BodySmall,
  Eyebrow,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useEvidenceResolver } from '../../../../hooks/queries/useEvidence';
import type { ObservationEvidenceSurfaceProps } from './ObservationEvidenceSurface.types';

const observationStateColorMap: Record<
  string,
  { text: string; bg: string; border: string; label: string; icon: LucideIcon }
> = {
  OBSERVED: {
    text: 'text-[#178A68]',
    bg: 'bg-[#EAF7F2]',
    border: 'border-[#B9E5D6]',
    label: 'Observed',
    icon: CheckCircle2,
  },
  MISSING: {
    text: 'text-[#B86F18]',
    bg: 'bg-[#FFF4E3]',
    border: 'border-[#F0D3A5]',
    label: 'Missing',
    icon: AlertCircle,
  },
  NON_COMPLIANT: {
    text: 'text-[#C24D57]',
    bg: 'bg-[#FFF0F1]',
    border: 'border-[#F0C3C7]',
    label: 'Non-Compliant',
    icon: AlertCircle,
  },
  UNKNOWN: {
    text: 'text-[#5F625F] dark:text-muted-foreground',
    bg: 'bg-[#F4F4F1] dark:bg-surface-metadata',
    border: 'border-[#E2E2DD] dark:border-border',
    label: 'Unknown',
    icon: HelpCircle,
  },
  FAILED: {
    text: 'text-[#A93442]',
    bg: 'bg-[#FDEBEC]',
    border: 'border-[#E9B3B9]',
    label: 'Collection Failed',
    icon: XCircle,
  },
};

/**
 * Authoritative Observation Evidence Surface (WX-304 / WX-1021).
 *
 * Answers "How do we know?":
 * - Finding -> Investigation -> Observation -> Evidence progressive disclosure
 * - Uses Canonical Evidence Resolver (WX-1021) to support both Findings & Change Events
 * - Displays backend-evaluated observed facts and lineage
 * - Discloses underlying raw protocol evidence on demand
 * - Preserves UNKNOWN and FAILED states honestly
 * - Enforces strict tenant domain security boundary
 * - Zero frontend observation inference or client-side evaluation
 */
export const ObservationEvidenceSurface: React.FC<ObservationEvidenceSurfaceProps> = ({
  domainId,
  domainName,
  findingId,
  initialEvidence,
  onReturn,
  onViewSnapshot,
  className = '',
  ...rest
}) => {
  const evidenceQuery = useEvidenceResolver({
    targetId: initialEvidence ? null : findingId,
    domainId,
  });
  const [expandedRawIds, setExpandedRawIds] = useState<Set<string>>(new Set());

  const data = initialEvidence || evidenceQuery.data;
  const isLoading = !initialEvidence && evidenceQuery.isLoading;
  const error = evidenceQuery.error;

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

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Resolving observation baseline..."
          description="Retrieving immutable evidence artifacts and canonical observations"
        />
      </div>
    );
  }

  // 2. Error State
  if (error && !data) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Evidence Retrieval Failed"
            description={`Could not retrieve observation evidence for ${findingId} on ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => evidenceQuery.refetch()}
          />
        </ReadingSurface>
      </div>
    );
  }

  // 3. Domain Isolation Guard (P0 Security Invariant)
  if (data && data.domainId && data.domainId !== domainId) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <UnavailableState
            title="Unauthorized Resource Access"
            description="The requested evidence does not belong to the active workspace domain."
            technicalNote="Cross-domain resource isolation enforced."
          />
        </ReadingSurface>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const observations = data.observations || [];
  const evidenceArtifacts = data.evidence || [];

  return (
    <Stack gap="xl" className={`relative z-10 w-full ${className}`} {...rest}>
      {/* 1. Return Navigation Action */}
      <Cluster justify="between" align="center" gap="md">
        {onReturn && (
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
          >
            <Icon icon={ArrowLeft} size="small" className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Investigation</span>
          </button>
        )}

        <TechnicalSmall variant="muted" className="text-xs">
          Domain: {domainName} &bull; Finding: {data.findingId}
        </TechnicalSmall>
      </Cluster>

      {/* 2. Header: How Do We Know? */}
      <ReadingSurface>
        <Stack gap="sm">
          <Cluster gap="xs" align="center">
            <Icon icon={Cpu} size="small" className="text-primary" />
            <Eyebrow variant="muted" className="text-xs">
              Evidence &bull; Observation Baseline
            </Eyebrow>
          </Cluster>

          <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
            Authoritative Evidence Lineage
          </Display>

          <BodySmall variant="muted" className="leading-relaxed text-xs sm:text-sm">
            Underlying observed infrastructure facts and protocol artifacts supporting this intelligence.
          </BodySmall>
        </Stack>
      </ReadingSurface>

      {/* 3. Rule Evaluation & Context */}
      {data.rule && (
        <ReadingSurface>
          <div className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-2">
            <Cluster justify="between" align="center" gap="sm">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                Evaluated Rule: {data.rule.name}
              </SectionTitle>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
                {data.rule.ruleId} (v{data.rule.ruleVersion})
              </span>
            </Cluster>
            <Body className="text-xs sm:text-sm leading-relaxed text-foreground/80 font-serif">
              {data.rule.evaluationLogic}
            </Body>
          </div>
        </ReadingSurface>
      )}

      {/* 4. Layer 1: Canonical Observations */}
      <ReadingSurface>
        <Stack gap="md">
          <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
            Observed Facts ({observations.length})
          </SectionTitle>

          {observations.length === 0 ? (
            <div className="p-6 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#F4F4F1] dark:bg-surface-metadata text-center space-y-1">
              <BodySmall variant="muted" className="text-xs text-[#5F625F] dark:text-muted-foreground">
                No observations recorded for this finding baseline.
              </BodySmall>
            </div>
          ) : (
            <Stack gap="sm">
              {observations.map((obs, idx) => {
                const stateConfig =
                  observationStateColorMap[obs.state] || observationStateColorMap.UNKNOWN;
                const StateIcon = stateConfig.icon;

                return (
                  <div
                    key={`${obs.key}-${idx}`}
                    className="p-4 sm:p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3"
                  >
                    <Cluster justify="between" align="center" gap="sm">
                      <Cluster gap="xs" align="center">
                        <TechnicalSmall variant="default" className="font-mono font-medium text-xs sm:text-sm text-foreground">
                          {obs.key}
                        </TechnicalSmall>
                      </Cluster>

                      <div
                        className={`flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${stateConfig.text} ${stateConfig.bg} ${stateConfig.border}`}
                      >
                        <StateIcon className="w-3 h-3" />
                        <span>{stateConfig.label}</span>
                      </div>
                    </Cluster>

                    {obs.value && (
                      <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider">
                        <TechnicalSmall variant="muted" className="text-[10px] uppercase tracking-wider mb-1 block text-[#5F625F] dark:text-muted-foreground">
                          Observed Value:
                        </TechnicalSmall>
                        <pre className="font-mono text-xs text-foreground bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-lg p-2.5 whitespace-pre-wrap break-all leading-tight m-0">
                          {obs.value}
                        </pre>
                      </div>
                    )}

                    <Cluster justify="between" align="center" gap="md" className="pt-1 text-[#5F625F] dark:text-muted-foreground text-[11px]">
                      <TechnicalSmall variant="muted" className="text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground">
                        Ref: {obs.evidenceRef}
                      </TechnicalSmall>
                      <TechnicalSmall variant="muted" className="text-[10px] text-[#5F625F] dark:text-muted-foreground">
                        Observed: {new Date(obs.observedAt).toLocaleString()}
                      </TechnicalSmall>
                    </Cluster>
                  </div>
                );
              })}
            </Stack>
          )}
        </Stack>
      </ReadingSurface>

      {/* 5. Layer 2: Protocol Evidence Lineage */}
      <ReadingSurface>
        <Stack gap="md">
          <Cluster justify="between" align="center" gap="sm">
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              Underlying Protocol Evidence ({evidenceArtifacts.length})
            </SectionTitle>
          </Cluster>

          {evidenceArtifacts.length === 0 ? (
            <div className="p-6 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#F4F4F1] dark:bg-surface-metadata text-center space-y-1">
              <BodySmall variant="muted" className="text-xs text-[#5F625F] dark:text-muted-foreground">
                Evidence is not available for this observation.
              </BodySmall>
            </div>
          ) : (
            <Stack gap="sm">
              {evidenceArtifacts.map((artifact) => {
                const isExpanded = expandedRawIds.has(artifact.evidenceId);

                return (
                  <div
                    key={artifact.evidenceId}
                    className="p-4 sm:p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3"
                  >
                    <Cluster justify="between" align="center" gap="sm">
                      <Cluster gap="xs" align="center">
                        <Icon icon={ShieldCheck} size="small" className="text-[#178A68]" />
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {artifact.category}
                        </span>
                      </Cluster>

                      <Cluster gap="xs" align="center">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#178A68] bg-[#EAF7F2] border border-[#B9E5D6] px-2 py-0.5 rounded">
                          {artifact.integrityStatus}
                        </span>
                        <span className="font-mono text-[10px] text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
                          {artifact.collector}
                        </span>
                      </Cluster>
                    </Cluster>

                    {/* Contextual protocol parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {artifact.target && (
                        <div className="p-2 bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-lg">
                          <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block font-mono">Target:</span>
                          <span className="font-mono text-[11px] text-foreground break-all">{artifact.target}</span>
                        </div>
                      )}
                      {artifact.responseStatus && (
                        <div className="p-2 bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-lg">
                          <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block font-mono">Status:</span>
                          <span className="font-mono text-[11px] text-foreground">
                            {artifact.requestMethod || 'HTTP'} {artifact.responseStatus} {artifact.protocolVersion ? `(${artifact.protocolVersion})` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progressive Disclosure: Raw Payload */}
                    {artifact.payload && (
                      <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleRawExpanded(artifact.evidenceId)}
                          className="flex items-center gap-1.5 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                        >
                          <Icon icon={isExpanded ? ChevronUp : ChevronDown} size="small" />
                          <span>{isExpanded ? 'Hide Raw Protocol Payload' : 'View Raw Protocol Payload'}</span>
                        </button>

                        {isExpanded && (
                          <div className="bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-lg p-3 overflow-x-auto space-y-2">
                            <Cluster justify="between" align="center" gap="sm">
                              <Cluster gap="xs" align="center">
                                <Icon icon={Terminal} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
                                <TechnicalSmall variant="muted" className="text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground">
                                  Raw Artifact Payload
                                </TechnicalSmall>
                              </Cluster>
                              {artifact.hashSha256 && (
                                <TechnicalSmall variant="muted" className="text-[10px] font-mono truncate max-w-[200px] text-[#5F625F] dark:text-muted-foreground">
                                  SHA256: {artifact.hashSha256}
                                </TechnicalSmall>
                              )}
                            </Cluster>
                            <pre className="font-mono text-[11px] text-foreground whitespace-pre-wrap break-all leading-snug m-0">
                              {artifact.payload}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    <Cluster justify="between" align="center" gap="md" className="pt-1 text-[#5F625F] dark:text-muted-foreground text-[10px]">
                      <TechnicalSmall variant="muted" className="font-mono text-[10px] text-[#5F625F] dark:text-muted-foreground">
                        ID: {artifact.evidenceId}
                      </TechnicalSmall>
                      <TechnicalSmall variant="muted" className="text-[10px] text-[#5F625F] dark:text-muted-foreground">
                        Captured: {new Date(artifact.collectionTime).toLocaleString()}
                      </TechnicalSmall>
                    </Cluster>
                  </div>
                );
              })}
            </Stack>
          )}
        </Stack>
      </ReadingSurface>

      {/* 6. Snapshot Reference Footer */}
      <Section spacing="none" className="pt-1">
        <ReadingSurface>
          <Cluster justify="between" align="center" gap="md" className="text-xs text-[#5F625F] dark:text-muted-foreground">
            <Cluster gap="xs" align="center">
              <Icon icon={Layers} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
              <TechnicalSmall variant="muted" className="text-[#5F625F] dark:text-muted-foreground">
                Snapshot: {data.snapshotId}
              </TechnicalSmall>
              {onViewSnapshot && (
                <button
                  type="button"
                  onClick={() => onViewSnapshot(data.snapshotId)}
                  className="text-xs text-[#3568C8] hover:underline font-mono font-medium ml-1 cursor-pointer transition-colors duration-150"
                >
                  (View Snapshot &rarr;)
                </button>
              )}
            </Cluster>
          </Cluster>
        </ReadingSurface>
      </Section>
    </Stack>
  );
};

ObservationEvidenceSurface.displayName = 'ObservationEvidenceSurface';
