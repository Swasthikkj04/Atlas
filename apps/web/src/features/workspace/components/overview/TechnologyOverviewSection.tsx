import React from 'react';
import { Cpu, ArrowRight, ShieldAlert } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { BodySmall } from '../../../../components/typography';
import { Cluster } from '../../../../components/layout';
import type { TechnologyOverviewSectionProps } from './TechnologyOverviewSection.types';

/**
 * Authoritative Technology & Platform Overview Section (WX-403 / TECH-008 / T1).
 *
 * Answers: "What are we running and how does it fit together?"
 *
 * Invariants:
 * - Backed strictly by backend InfrastructureOverviewDto.technologies & technologyArchitecture
 * - Zero client-side technology inference, header regex, or synthetic categorization
 * - Displays synthesized ingress path, component roles, meanings, and anti-overreach claim boundaries
 * - Accessible list semantics and resilient responsive layout
 */
export const TechnologyOverviewSection: React.FC<TechnologyOverviewSectionProps> = ({
  technologies,
  technologyArchitecture,
  status = technologies.length > 0 ? 'PRESENT' : 'ABSENT',
  className = '',
  ...rest
}) => {
  const isPresent = status === 'PRESENT' && (technologies.length > 0 || Boolean(technologyArchitecture));
  const isUnavailable = status === 'UNAVAILABLE';

  const ingressPath = technologyArchitecture?.ingressPath || [];
  const keyTechnologies = technologyArchitecture?.keyTechnologies || [];
  const integrations = technologyArchitecture?.integrations || [];
  const knownUnknowns = technologyArchitecture?.knownUnknowns || [];

  return (
    <div
      className={`p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-4 ${className}`}
      {...rest}
    >
      <Cluster justify="between" align="center" gap="sm">
        <Cluster gap="xs" align="center">
          <Icon icon={Cpu} size="small" className="text-[#3568C8]" />
          <h3 className="font-mono text-xs font-semibold text-foreground tracking-wide m-0">
            Web & Application Architecture
          </h3>
        </Cluster>
        <span
          className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata select-none"
          aria-label={`Status: ${status}`}
        >
          {status}
        </span>
      </Cluster>

      {/* 1. Architecture Summary Narrative if present */}
      {technologyArchitecture?.architectureSummary && (
        <div className="p-3.5 rounded-lg bg-[#F8F9FA] dark:bg-surface-metadata/50 border border-[#E8EAED] dark:border-border text-xs text-foreground leading-relaxed">
          {technologyArchitecture.architectureSummary}
        </div>
      )}

      {/* 2. Ingress Request Path if present */}
      {ingressPath.length > 1 && (
        <div className="space-y-1.5 pt-1">
          <div className="font-mono text-[11px] font-medium text-[#5F625F] dark:text-muted-foreground uppercase tracking-wider">
            Observed Ingress Path
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {ingressPath.map((hop, idx) => (
              <React.Fragment key={`${hop.technologyId}-${idx}`}>
                <span className="px-2 py-1 rounded bg-[#EEF4FF] dark:bg-primary/10 border border-[#C8D8F6] dark:border-primary/20 text-[#3568C8] dark:text-primary font-medium">
                  {hop.technologyName}
                  {hop.role && <span className="opacity-70 text-[10px] ml-1">({hop.layer})</span>}
                </span>
                {idx < ingressPath.length - 1 && (
                  <Icon icon={ArrowRight} size="small" className="text-muted-foreground opacity-50 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* 3. Key Technology Meaning Cards if present */}
      {keyTechnologies.length > 0 ? (
        <div className="space-y-2 pt-1">
          <div className="font-mono text-[11px] font-medium text-[#5F625F] dark:text-muted-foreground uppercase tracking-wider">
            Observed Components & Meaning
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {keyTechnologies.map((tech) => (
              <div
                key={tech.technologyId || tech.name}
                className="p-3 rounded-lg border border-[#E2E2DD] dark:border-border bg-[#FBFBFA] dark:bg-surface-metadata/30 space-y-1.5"
              >
                <Cluster justify="between" align="center">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {tech.name} {tech.version ? `v${tech.version}` : ''}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#EEF4FF] dark:bg-primary/10 text-[#3568C8] dark:text-primary border border-[#C8D8F6] dark:border-primary/20">
                    {tech.layer}
                  </span>
                </Cluster>
                <div className="text-[11px] text-[#5F625F] dark:text-muted-foreground leading-snug">
                  {tech.infrastructureMeaning || tech.role}
                </div>
                {tech.whyDetected && (
                  <div className="text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground opacity-80">
                    Why: {tech.whyDetected}
                  </div>
                )}
                {tech.whatThisDoesNotProve && (
                  <div className="flex items-start gap-1 text-[10px] text-[#8C6B00] dark:text-yellow-400/90 pt-0.5">
                    <Icon icon={ShieldAlert} size="small" className="shrink-0 mt-0.5" />
                    <span>{tech.whatThisDoesNotProve}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : isPresent ? (
        /* Fallback to simple badges if no rich architecture object */
        <ul
          role="list"
          aria-label="Detected Web & Application Technologies"
          className="flex flex-wrap gap-2 pt-1 p-0 m-0 list-none"
        >
          {technologies.map((tech) => (
            <li key={tech} className="inline-flex">
              <span className="px-2.5 py-1 rounded-md bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-xs font-mono text-foreground font-medium break-words max-w-full">
                {tech}
              </span>
            </li>
          ))}
        </ul>
      ) : isUnavailable ? (
        <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
          Technology discovery data unavailable.
        </BodySmall>
      ) : (
        <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
          No application framework or runtime technology detected.
        </BodySmall>
      )}

      {/* 4. External Service Integrations if present */}
      {integrations.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[#E8EAED] dark:border-border">
          <div className="font-mono text-[11px] font-medium text-[#5F625F] dark:text-muted-foreground uppercase tracking-wider">
            External Service Integrations
          </div>
          <div className="flex flex-wrap gap-2">
            {integrations.map((integration) => (
              <span
                key={integration.technologyId || integration.name}
                className="px-2.5 py-1 rounded-md bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-xs font-mono text-foreground"
              >
                {integration.name} <span className="text-[#5F625F] dark:text-muted-foreground">({integration.role || integration.category})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Known Unknowns if present */}
      {knownUnknowns.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-[#E8EAED] dark:border-border">
          <div className="font-mono text-[10px] font-medium text-[#5F625F] dark:text-muted-foreground uppercase tracking-wider">
            Unobservable Architecture Dimensions
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-[#5F625F] dark:text-muted-foreground">
            {knownUnknowns.map((unknown) => (
              <span
                key={unknown.dimension}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-metadata/40 border border-border text-[10px] font-mono"
              >
                <span>{unknown.dimension}:</span>
                <span className="font-semibold text-muted-foreground">{unknown.status}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

TechnologyOverviewSection.displayName = 'TechnologyOverviewSection';
