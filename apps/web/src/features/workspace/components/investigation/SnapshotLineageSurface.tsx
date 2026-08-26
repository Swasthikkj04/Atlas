import React from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Layers,
  Clock,
  Lock,
  History,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  SectionTitle,
  BodySmall,
  Eyebrow,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, Grid, ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useSnapshot } from '../../../../hooks/queries/useSnapshots';
import type { SnapshotLineageSurfaceProps } from './SnapshotLineageSurface.types';

/**
 * Authoritative Snapshot Lineage Surface (WX-305).
 *
 * Answers "Which infrastructure states are we comparing?":
 * - Establishes trusted temporal relationship between Current and Previous snapshots
 * - Strictly maintains backend authority (zero client-side JSON diffing or state derivation)
 * - Explicitly and honestly displays one-snapshot/initial baseline states without faking history
 * - Enforces strict tenant domain security boundary
 * - Connects investigation lineage into WX-304 Observation Evidence
 */
export const SnapshotLineageSurface: React.FC<SnapshotLineageSurfaceProps> = ({
  domainId,
  domainName,
  snapshotId,
  previousSnapshotId,
  changeId,
  findingId,
  initialSnapshot,
  onReturn,
  onViewEvidence,
  onViewFinding,
  className = '',
  ...rest
}) => {
  const currentSnapshotQuery = useSnapshot(initialSnapshot ? null : snapshotId);
  const prevSnapshotId =
    previousSnapshotId || initialSnapshot?.previousSnapshotId || currentSnapshotQuery.data?.previousSnapshotId;
  const previousSnapshotQuery = useSnapshot(prevSnapshotId || null);

  const currentSnapshot = initialSnapshot || currentSnapshotQuery.data;
  const previousSnapshot = previousSnapshotQuery.data;

  const isLoading =
    (!initialSnapshot && currentSnapshotQuery.isLoading) ||
    (Boolean(prevSnapshotId) && previousSnapshotQuery.isLoading);
  const error = currentSnapshotQuery.error || (prevSnapshotId ? previousSnapshotQuery.error : null);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Resolving snapshot lineage..."
          description="Retrieving authoritative infrastructure snapshot baseline and temporal history"
        />
      </div>
    );
  }

  // 2. Error State
  if (error && !currentSnapshot) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Snapshot Retrieval Failed"
            description={`Could not retrieve infrastructure snapshot ${snapshotId} for domain ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => {
              currentSnapshotQuery.refetch();
              if (prevSnapshotId) previousSnapshotQuery.refetch();
            }}
          />
        </ReadingSurface>
      </div>
    );
  }

  // 3. Domain Isolation Guard (P0 Security Invariant)
  if (currentSnapshot && currentSnapshot.domainId && currentSnapshot.domainId !== domainId) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <UnavailableState
            title="Unauthorized Resource Access"
            description="The requested snapshot does not belong to the active workspace domain."
            technicalNote="Cross-domain resource isolation enforced."
          />
        </ReadingSurface>
      </div>
    );
  }

  if (!currentSnapshot) {
    return null;
  }

  const currentTimestamp = currentSnapshot.capturedAt || currentSnapshot.createdAt;
  const prevTimestamp = previousSnapshot?.capturedAt || previousSnapshot?.createdAt;

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
          Domain: {domainName} &bull; Snapshot: {currentSnapshot.id}
        </TechnicalSmall>
      </Cluster>

      {/* 2. Header Context */}
      <ReadingSurface>
        <Stack gap="sm">
          <Cluster gap="xs" align="center">
            <Icon icon={History} size="small" className="text-primary" />
            <Eyebrow variant="muted" className="text-xs">
              Snapshot Lineage &bull; Historical Comparison Baseline
            </Eyebrow>
          </Cluster>

          <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
            Authoritative Historical Context
          </Display>

          <BodySmall variant="muted" className="leading-relaxed text-xs sm:text-sm">
            Immutable infrastructure snapshots establishing the verified baseline and temporal comparisons.
          </BodySmall>
        </Stack>
      </ReadingSurface>

      {/* 3. Temporal Snapshot Comparison Grid */}
      <ReadingSurface>
        <Stack gap="sm">
          <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Snapshot Comparison
          </SectionTitle>

          <Grid cols={2} gap="md">
            {/* Column A: Previous Snapshot */}
            <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm space-y-3">
              <Cluster justify="between" align="center" gap="sm">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Previous Snapshot
                </span>
                {previousSnapshot && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5 rounded bg-surface">
                    Baseline
                  </span>
                )}
              </Cluster>

              {previousSnapshot ? (
                <div className="space-y-2">
                  <TechnicalSmall variant="default" className="font-mono text-xs text-foreground block font-medium">
                    ID: {previousSnapshot.id}
                  </TechnicalSmall>

                  <Cluster gap="xs" align="center" className="text-muted-foreground text-xs">
                    <Icon icon={Clock} size="small" />
                    <span>{prevTimestamp ? new Date(prevTimestamp).toLocaleString() : 'Timestamp unavailable'}</span>
                  </Cluster>

                  {(previousSnapshot.httpStatus || previousSnapshot.responseTimeMs) && (
                    <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono">
                      HTTP {previousSnapshot.httpStatus ?? 200} &bull; {previousSnapshot.responseTimeMs ?? 0}ms response
                    </div>
                  )}

                  {previousSnapshot.tlsCertificate && (
                    <Cluster gap="xs" align="center" className="text-[11px] text-muted-foreground font-mono pt-1">
                      <Icon icon={Lock} size="small" />
                      <span className="truncate">{previousSnapshot.tlsCertificate.issuer}</span>
                    </Cluster>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center space-y-1">
                  <BodySmall variant="muted" className="text-xs italic">
                    No previous snapshot is available for comparison.
                  </BodySmall>
                  <TechnicalSmall variant="muted" className="text-[10px] block">
                    This snapshot represents the initial established baseline.
                  </TechnicalSmall>
                </div>
              )}
            </div>

            {/* Column B: Current Snapshot */}
            <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm space-y-3">
              <Cluster justify="between" align="center" gap="sm">
                <span className="font-mono text-[10px] uppercase tracking-wider text-severity-success font-semibold">
                  Current Snapshot
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-severity-success bg-severity-success-bg border border-severity-success-border px-2 py-0.5 rounded">
                  ● Active State
                </span>
              </Cluster>

              <div className="space-y-2">
                <TechnicalSmall variant="default" className="font-mono text-xs text-foreground block font-medium">
                  ID: {currentSnapshot.id}
                </TechnicalSmall>

                <Cluster gap="xs" align="center" className="text-muted-foreground text-xs">
                  <Icon icon={Clock} size="small" />
                  <span>{currentTimestamp ? new Date(currentTimestamp).toLocaleString() : 'Timestamp unavailable'}</span>
                </Cluster>

                {(currentSnapshot.httpStatus || currentSnapshot.responseTimeMs) && (
                  <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono">
                    HTTP {currentSnapshot.httpStatus ?? 200} &bull; {currentSnapshot.responseTimeMs ?? 0}ms response
                  </div>
                )}

                {currentSnapshot.tlsCertificate && (
                  <Cluster gap="xs" align="center" className="text-[11px] text-muted-foreground font-mono pt-1">
                    <Icon icon={Lock} size="small" />
                    <span className="truncate">{currentSnapshot.tlsCertificate.issuer}</span>
                  </Cluster>
                )}
              </div>
            </div>
          </Grid>
        </Stack>
      </ReadingSurface>

      {/* 4. Investigation Action Pathways */}
      <ReadingSurface>
        <div className="p-5 rounded-xl border border-border bg-card/40 backdrop-blur-sm space-y-3">
          <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Investigative Lineage Actions
          </SectionTitle>

          <Cluster justify="between" align="center" gap="md" className="pt-1 flex-wrap">
            <Cluster gap="md" align="center">
              {findingId && onViewFinding && (
                <button
                  type="button"
                  onClick={() => onViewFinding(findingId)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline font-mono font-medium cursor-pointer"
                >
                  <span>Related Finding ({findingId})</span>
                  <Icon icon={ArrowUpRight} size="small" />
                </button>
              )}

              {changeId && (
                <TechnicalSmall variant="muted" className="text-xs font-mono">
                  Change Event: {changeId}
                </TechnicalSmall>
              )}
            </Cluster>

            {onViewEvidence && (
              <button
                type="button"
                onClick={() => onViewEvidence(findingId || currentSnapshot.id)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-mono font-medium cursor-pointer"
              >
                <span>View Supporting Evidence &rarr;</span>
              </button>
            )}
          </Cluster>
        </div>
      </ReadingSurface>

      {/* 5. Snapshot Reference Footer */}
      <Section spacing="none" className="pt-1">
        <ReadingSurface>
          <Cluster justify="between" align="center" gap="md" className="text-xs text-muted-foreground">
            <Cluster gap="xs" align="center">
              <Icon icon={Layers} size="small" className="text-muted-foreground" />
              <TechnicalSmall variant="muted">
                Lineage Baseline: {currentSnapshot.id}
              </TechnicalSmall>
            </Cluster>
            <TechnicalSmall variant="muted">
              Domain: {domainName}
            </TechnicalSmall>
          </Cluster>
        </ReadingSurface>
      </Section>
    </Stack>
  );
};

SnapshotLineageSurface.displayName = 'SnapshotLineageSurface';
