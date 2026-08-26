import { type HTMLAttributes } from 'react';
import type { OverviewSectionStatus } from '../../contracts/overview.contract';

/**
 * Props for the TlsCertificateOverviewSection component (WX-405).
 */
export interface TlsCertificateOverviewSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Authoritative certificate validity flag from backend DTO */
  readonly sslValid: boolean;
  /** Authoritative expiration date from backend DTO */
  readonly sslExpiresAt: string | null;
  /** Categorical section presence status */
  readonly status?: OverviewSectionStatus;
  /** Callback fired if an authoritative finding or evidence is linked to TLS */
  readonly onViewEvidence?: () => void;
  /** Custom CSS classes */
  readonly className?: string;
}
