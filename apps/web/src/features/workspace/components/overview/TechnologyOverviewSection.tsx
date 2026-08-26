import React from 'react';
import { Cpu } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { BodySmall } from '../../../../components/typography';
import { Cluster } from '../../../../components/layout';
import type { TechnologyOverviewSectionProps } from './TechnologyOverviewSection.types';

/**
 * Authoritative Technology & Platform Overview Section (WX-403).
 *
 * Answers: "What are we running?"
 *
 * Invariants:
 * - Backed strictly by backend InfrastructureOverviewDto.technologies
 * - Zero client-side technology inference, header regex, or synthetic categorization
 * - No colorful logo grids, percentage bars, or health scores
 * - Accessible list semantics and resilient responsive layout
 */
export const TechnologyOverviewSection: React.FC<TechnologyOverviewSectionProps> = ({
  technologies,
  status = technologies.length > 0 ? 'PRESENT' : 'ABSENT',
  className = '',
  ...rest
}) => {
  const isPresent = status === 'PRESENT' && technologies.length > 0;
  const isUnavailable = status === 'UNAVAILABLE';

  return (
    <div
      className={`p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3 ${className}`}
      {...rest}
    >
      <Cluster justify="between" align="center" gap="sm">
        <Cluster gap="xs" align="center">
          <Icon icon={Cpu} size="small" className="text-[#3568C8]" />
          <h3 className="font-mono text-xs font-semibold text-foreground tracking-wide m-0">
            Web & Application Technologies
          </h3>
        </Cluster>
        <span
          className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata select-none"
          aria-label={`Status: ${status}`}
        >
          {status}
        </span>
      </Cluster>

      {isPresent ? (
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
    </div>
  );
};

TechnologyOverviewSection.displayName = 'TechnologyOverviewSection';
