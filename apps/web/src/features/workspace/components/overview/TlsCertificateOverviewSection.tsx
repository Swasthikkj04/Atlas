import React from 'react';
import { Lock } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { BodySmall, TechnicalSmall } from '../../../../components/typography';
import { Cluster } from '../../../../components/layout';
import type { TlsCertificateOverviewSectionProps } from './TlsCertificateOverviewSection.types';

/**
 * Authoritative TLS & Certificate Overview Section (WX-405).
 *
 * Answers: "Will anything expire or require attention?"
 *
 * Invariants:
 * - Backed strictly by backend InfrastructureOverviewDto.sslValid and sslExpiresAt
 * - Zero client-side certificate parsing, validity calculations, or severity thresholds
 * - No security score, certificate health meters, or expiry progress bars
 * - Color-independent state indicators and accessible typography
 */
export const TlsCertificateOverviewSection: React.FC<TlsCertificateOverviewSectionProps> = ({
  sslValid,
  sslExpiresAt,
  status = sslValid || sslExpiresAt ? 'PRESENT' : 'ABSENT',
  className = '',
  ...rest
}) => {
  const isPresent = status === 'PRESENT' && (sslValid || Boolean(sslExpiresAt));
  const isUnavailable = status === 'UNAVAILABLE';

  return (
    <div
      className={`p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3 ${className}`}
      {...rest}
    >
      <Cluster justify="between" align="center" gap="sm">
        <Cluster gap="xs" align="center">
          <Icon icon={Lock} size="small" className="text-[#3568C8]" />
          <h3 className="font-mono text-xs font-semibold text-foreground tracking-wide m-0">
            Security & TLS
          </h3>
        </Cluster>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border select-none ${
            sslValid
              ? 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6]'
              : 'text-[#5F625F] dark:text-muted-foreground border-[#E2E2DD] dark:border-border bg-[#F4F4F1] dark:bg-surface-metadata'
          }`}
          aria-label={`Certificate status: ${sslValid ? 'Valid' : 'Unverified'}`}
        >
          {sslValid ? 'VALID' : 'UNVERIFIED'}
        </span>
      </Cluster>

      {isPresent ? (
        <div className="space-y-1.5">
          <Cluster gap="xs" align="center" className="text-xs">
            <span className="font-medium text-foreground">
              {sslValid ? 'TLS Certificate Active' : 'No Valid Certificate'}
            </span>
          </Cluster>

          {sslExpiresAt ? (
            <TechnicalSmall variant="muted" className="text-[11px] font-mono block text-[#5F625F] dark:text-muted-foreground">
              Expires: {new Date(sslExpiresAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </TechnicalSmall>
          ) : (
            <TechnicalSmall variant="muted" className="text-[11px] font-mono block text-[#5F625F] dark:text-muted-foreground">
              Expiry: Not available
            </TechnicalSmall>
          )}
        </div>
      ) : isUnavailable ? (
        <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
          TLS discovery data unavailable.
        </BodySmall>
      ) : (
        <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
          No TLS certificate observed.
        </BodySmall>
      )}
    </div>
  );
};

TlsCertificateOverviewSection.displayName = 'TlsCertificateOverviewSection';
