import { type HTMLAttributes } from 'react';
import type { OverviewSectionStatus } from '../../contracts/overview.contract';

/**
 * Props for the DnsNetworkOverviewSection component (WX-404).
 */
export interface DnsNetworkOverviewSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Authoritative list of resolved IPv4 addresses from backend DTO */
  readonly ipv4Addresses: readonly string[];
  /** Authoritative list of resolved IPv6 addresses from backend DTO */
  readonly ipv6Addresses: readonly string[];
  /** Categorical section presence status */
  readonly status?: OverviewSectionStatus;
  /** Callback fired if an authoritative finding is linked to DNS */
  readonly onViewFinding?: (findingId: string) => void;
  /** Custom CSS classes */
  readonly className?: string;
}
