import React from 'react';
import { Network } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { BodySmall, TechnicalSmall } from '../../../../components/typography';
import { Cluster } from '../../../../components/layout';
import type { DnsNetworkOverviewSectionProps } from './DnsNetworkOverviewSection.types';

/**
 * Authoritative DNS & Network Overview Section (WX-404).
 *
 * Answers: "How is this domain configured?"
 *
 * Invariants:
 * - Backed strictly by backend InfrastructureOverviewDto.ipv4Addresses and ipv6Addresses
 * - Zero client-side DNS lookups, IP geolocation, or provider classification
 * - No fake DNS health scores, globe animations, or scanner-style tables
 * - Accessible list semantics and overflow-safe layout for long IPv6 addresses
 */
export const DnsNetworkOverviewSection: React.FC<DnsNetworkOverviewSectionProps> = ({
  ipv4Addresses,
  ipv6Addresses,
  status = ipv4Addresses.length > 0 || ipv6Addresses.length > 0 ? 'PRESENT' : 'ABSENT',
  className = '',
  ...rest
}) => {
  const isPresent = status === 'PRESENT' && (ipv4Addresses.length > 0 || ipv6Addresses.length > 0);
  const isUnavailable = status === 'UNAVAILABLE';

  return (
    <div
      className={`p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3 ${className}`}
      {...rest}
    >
      <Cluster justify="between" align="center" gap="sm">
        <Cluster gap="xs" align="center">
          <Icon icon={Network} size="small" className="text-[#3568C8]" />
          <h3 className="font-mono text-xs font-semibold text-foreground tracking-wide m-0">
            DNS & Network Infrastructure
          </h3>
        </Cluster>
        <span
          className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata select-none"
          aria-label={`Status: ${status}`}
        >
          {isPresent ? 'RESOLVED' : status}
        </span>
      </Cluster>

      {isPresent ? (
        <div className="space-y-2.5">
          {/* IPv4 Section */}
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
              IPv4 Addresses
            </span>
            {ipv4Addresses.length > 0 ? (
              <ul
                role="list"
                aria-label="Resolved IPv4 Addresses"
                className="flex flex-wrap gap-1.5 p-0 m-0 list-none"
              >
                {ipv4Addresses.map((ip) => (
                  <li key={ip} className="inline-flex">
                    <span className="px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-[11px] font-mono text-foreground select-all">
                      {ip}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
                No IPv4 addresses resolved.
              </BodySmall>
            )}
          </div>

          {/* IPv6 Section */}
          <div className="space-y-1.5 pt-0.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
              IPv6 Addresses
            </span>
            {ipv6Addresses.length > 0 ? (
              <ul
                role="list"
                aria-label="Resolved IPv6 Addresses"
                className="flex flex-wrap gap-1.5 p-0 m-0 list-none"
              >
                {ipv6Addresses.map((ip) => (
                  <li key={ip} className="inline-flex max-w-full">
                    <span className="px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground break-all select-all">
                      {ip}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <TechnicalSmall variant="muted" className="text-[10px] font-mono block text-[#5F625F] dark:text-muted-foreground">
                IPv6: Not observed
              </TechnicalSmall>
            )}
          </div>
        </div>
      ) : isUnavailable ? (
        <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
          DNS resolution data unavailable.
        </BodySmall>
      ) : (
        <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
          No network addresses resolved.
        </BodySmall>
      )}
    </div>
  );
};

DnsNetworkOverviewSection.displayName = 'DnsNetworkOverviewSection';
