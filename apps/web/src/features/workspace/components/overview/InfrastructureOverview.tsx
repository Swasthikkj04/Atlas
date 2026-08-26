import {
  Globe,
  Server,
  Clock,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  SectionTitle,
  BodySmall,
  Eyebrow,
} from '../../../../components/typography';
import { Stack, Cluster, Grid, ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useDomainOverview } from '../../../../hooks/queries/useOverview';
import { useDomainUnderstandingJobs } from '../../../../hooks/queries/useUnderstanding';
import { resolveOverviewState } from '../../contracts/overview.contract';
import { findActiveJob } from '../../contracts/understanding-convergence.contract';
import { CompactInfrastructureOverview } from './CompactInfrastructureOverview';
import { InfrastructureFindingsSection } from './InfrastructureFindingsSection';
import { TechnologyOverviewSection } from './TechnologyOverviewSection';
import { DnsNetworkOverviewSection } from './DnsNetworkOverviewSection';
import { TlsCertificateOverviewSection } from './TlsCertificateOverviewSection';
import { UnderstandNowButton } from '../understanding';
import type { InfrastructureOverviewProps } from './InfrastructureOverview.types';

/**
 * Authoritative Infrastructure Overview Surface (WX-402 / WX-910 / WX-911 / WX-915).
 *
 * Dedicated home for infrastructure inventory, model, and active findings:
 * - Header: INFRASTRUCTURE · Infrastructure Overview · Observed perimeter topology, DNS, HTTP, and TLS for {domainName}
 * - INFRASTRUCTURE MODEL:
 *   - Authoritative 8-category compact inventory (Edge, Web Server, Application, Hosting, DNS, TLS/SSL, IP Address, Open Ports)
 *   - Deep categorized components (Edge Delivery, Web Server, Security & TLS, DNS & Network, Web Technologies)
 * - INFRASTRUCTURE FINDINGS:
 *   - Authoritative list of active findings with severity, title, summary, and direct investigation links
 *   - Honest calm empty state when zero findings are observed
 * - Strict Invariants:
 *   - Backed exclusively by backend InfrastructureOverviewDto and useFindings contracts
 *   - Zero client-side infrastructure inference or raw discovery JSON parsing
 *   - Respects honest PRESENT / ABSENT / UNAVAILABLE / EMPTY / UNDERSTANDING semantics
 */
export const InfrastructureOverview: React.FC<InfrastructureOverviewProps> = ({
  domainId,
  domainName,
  initialData,
  onViewSnapshot,
  onViewFinding,
  onViewAllFindings,
  className = '',
  ...rest
}) => {
  const overviewQuery = useDomainOverview(initialData ? null : domainId);
  const domainJobsQuery = useDomainUnderstandingJobs(initialData ? null : domainId);
  const data = initialData || overviewQuery.data;

  const activeJob = findActiveJob(domainJobsQuery.data);
  const isUnderstanding = Boolean(activeJob);

  const state = resolveOverviewState({
    data,
    isLoading: !initialData && overviewQuery.isLoading,
    isError: !initialData && overviewQuery.isError,
    isDomainMismatch: Boolean(data && data.domain && data.domain.id !== domainId),
    isUnderstanding,
  });

  // 1. Loading State (Only when no prior data exists)
  if (state === 'LOADING' && !data) {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Resolving infrastructure model..."
          description="Retrieving authoritative infrastructure facts and category layout"
        />
      </div>
    );
  }

  // 2. Understanding in Progress State (Only when no prior data exists - WX-915 / WX-1018)
  if (state === 'UNDERSTANDING' && !data) {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Understanding infrastructure…"
          description={`Discovering perimeter topology, DNS records, services, and TLS certificates for ${domainName}`}
        />
      </div>
    );
  }

  // 3. Unauthorized / Cross-domain State
  if (state === 'UNAVAILABLE') {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <UnavailableState
            title="Unauthorized Resource Access"
            description="The requested domain infrastructure does not belong to the active workspace."
            technicalNote="Cross-domain resource isolation enforced."
          />
        </ReadingSurface>
      </div>
    );
  }

  // 4. Error State
  if ((state === 'ERROR' || !data) && !overviewQuery.isLoading) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <ErrorState
            error={overviewQuery.error}
            title="Infrastructure Retrieval Failed"
            description={`Could not retrieve authoritative infrastructure overview for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => overviewQuery.refetch()}
          />
        </ReadingSurface>
      </div>
    );
  }

  // 5. Empty State / No Understanding
  if (state === 'EMPTY' && !data) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <div className="p-8 rounded-2xl border border-border-hairline bg-surface-elevated text-center space-y-4">
            <Cluster gap="xs" align="center" justify="center">
              <Icon icon={Layers} size="small" className="text-muted-foreground" />
              <Eyebrow variant="muted" className="text-xs">
                INFRASTRUCTURE
              </Eyebrow>
            </Cluster>
            <div className="space-y-1.5">
              <Display className="text-xl font-medium text-foreground">
                Infrastructure hasn't been understood yet.
              </Display>
              <BodySmall variant="muted" className="max-w-md mx-auto leading-relaxed">
                Run understanding to discover the perimeter topology, services, certificates, and findings for {domainName}.
              </BodySmall>
            </div>
            <div className="pt-2 flex justify-center">
              <UnderstandNowButton
                domainId={domainId}
                domainName={domainName}
              />
            </div>
          </div>
        </ReadingSurface>
      </div>
    );
  }

  const { infrastructure, latestSnapshot } = data;
  const observedTimestamp = (latestSnapshot as any)?.capturedAt || latestSnapshot?.createdAt;

  return (
    <Section spacing="lg" className={`w-full ${className}`} {...rest}>
      <Stack gap="xl" className="w-full">
        {/* 1. Header Identity & Context (WX-1018: Explicit Current State Identification) */}
        <ReadingSurface>
          <Stack gap="sm">
            <Cluster justify="between" align="center" gap="md">
              <Cluster gap="xs" align="center">
                <Icon icon={Layers} size="small" className="text-[#3568C8]" />
                <Eyebrow variant="muted" className="text-xs font-mono uppercase tracking-[0.2em]">
                  INFRASTRUCTURE
                </Eyebrow>
              </Cluster>

              <Cluster gap="sm" align="center">
                {isUnderstanding ? (
                  <span
                    className="font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-[#C8D8F6] text-[#3568C8] bg-[#EEF4FF] animate-pulse"
                    data-testid="infrastructure-updating-badge"
                  >
                    UNDERSTANDING · Updating model…
                  </span>
                ) : (
                  <span
                    className="font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border border-[#B9E5D6] text-[#178A68] bg-[#EAF7F2]"
                    data-testid="infrastructure-current-state-badge"
                  >
                    CURRENT VERIFIED STATE
                  </span>
                )}

                {latestSnapshot && onViewSnapshot && (
                  <button
                    type="button"
                    onClick={() => onViewSnapshot(latestSnapshot.id)}
                    className="flex items-center gap-1 text-xs text-[#5F625F] dark:text-muted-foreground hover:text-foreground font-mono font-medium transition-colors cursor-pointer group"
                  >
                    <span>Snapshot: {latestSnapshot.id.slice(0, 10)}...</span>
                    <Icon icon={ArrowUpRight} size="small" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                )}
              </Cluster>
            </Cluster>

            <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
              Infrastructure Overview
            </Display>

            <Cluster gap="md" align="center" className="text-xs text-[#5F625F] dark:text-muted-foreground pt-0.5 flex-wrap">
              <span>Observed perimeter topology, DNS, HTTP, and TLS for <strong className="font-mono text-foreground font-medium">{domainName}</strong></span>
              {observedTimestamp && (
                <Cluster gap="xs" align="center">
                  <Icon icon={Clock} size="small" />
                  <span>Observed: {new Date(observedTimestamp).toLocaleString()}</span>
                </Cluster>
              )}
            </Cluster>
          </Stack>
        </ReadingSurface>

        {/* 2. INFRASTRUCTURE MODEL (WX-909 / WX-910 / WX-911) */}
        <ReadingSurface>
          <Stack gap="lg">
            <div className="px-1 flex items-center justify-between border-b border-border-hairline pb-2">
              <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-muted-foreground/75">
                INFRASTRUCTURE MODEL
              </span>
            </div>

            {/* 8-Category Authoritative Inventory Card */}
            <CompactInfrastructureOverview
              domainId={domainId}
              domainName={domainName}
            />

            {/* Categorized Infrastructure Components Grid */}
            <Stack gap="md" className="pt-2">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categorized Infrastructure Components
              </SectionTitle>

              <Grid cols={2} gap="md">
                {/* Category A: Edge Delivery & CDN */}
                <div className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3">
                  <Cluster justify="between" align="center" gap="sm">
                    <Cluster gap="xs" align="center">
                      <Icon icon={Globe} size="small" className="text-[#3568C8]" />
                      <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
                        Edge Delivery & CDN
                      </span>
                    </Cluster>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
                      {infrastructure.cdn ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </Cluster>

                  {infrastructure.cdn ? (
                    <div className="space-y-1.5">
                      <span className="inline-block px-2.5 py-1 rounded bg-[#EEF4FF] dark:bg-primary/10 border border-[#C8D8F6] dark:border-primary/20 text-xs font-mono text-[#3568C8] dark:text-primary font-medium">
                        {infrastructure.cdn}
                      </span>
                    </div>
                  ) : (
                    <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
                      No dedicated CDN layer detected.
                    </BodySmall>
                  )}
                </div>

                {/* Category B: Web Server & Reverse Proxy */}
                <div className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3">
                  <Cluster justify="between" align="center" gap="sm">
                    <Cluster gap="xs" align="center">
                      <Icon icon={Server} size="small" className="text-[#3568C8]" />
                      <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
                        Web Server & Proxy
                      </span>
                    </Cluster>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
                      {infrastructure.webServer ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </Cluster>

                  {infrastructure.webServer ? (
                    <div className="space-y-2">
                      <span className="inline-block px-2.5 py-1 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-foreground text-xs font-mono font-medium">
                        {infrastructure.webServer}
                      </span>
                    </div>
                  ) : (
                    <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
                      No web server signature observed.
                    </BodySmall>
                  )}
                </div>

                {/* Category C: Security & TLS (WX-405) */}
                <TlsCertificateOverviewSection
                  sslValid={infrastructure.sslValid}
                  sslExpiresAt={infrastructure.sslExpiresAt}
                />

                {/* Category D: DNS & Network Infrastructure (WX-404) */}
                <DnsNetworkOverviewSection
                  ipv4Addresses={infrastructure.ipv4Addresses}
                  ipv6Addresses={infrastructure.ipv6Addresses}
                />
              </Grid>

              {/* Category E: Web & Application Technologies (WX-403) */}
              <TechnologyOverviewSection
                technologies={infrastructure.technologies}
              />
            </Stack>
          </Stack>
        </ReadingSurface>

        {/* 3. INFRASTRUCTURE FINDINGS (WX-911) */}
        <ReadingSurface>
          <div className="pt-4 border-t border-border-hairline">
            <InfrastructureFindingsSection
              domainId={domainId}
              domainName={domainName}
              onViewFinding={onViewFinding}
              onViewAllFindings={onViewAllFindings}
            />
          </div>
        </ReadingSurface>
      </Stack>
    </Section>
  );
};

InfrastructureOverview.displayName = 'InfrastructureOverview';

