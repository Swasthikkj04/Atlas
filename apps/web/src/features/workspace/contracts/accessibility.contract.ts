import type { WorkspaceSemanticState } from './workspace-state-matrix.contract.ts';
import type { FindingSeverity } from '../../../types/api/finding.dto.ts';

/**
 * Authoritative State Live Region Announcement Descriptor (WX-706).
 */
export interface StateAnnouncementDescriptor {
  readonly message: string;
  readonly ariaLive: 'polite' | 'assertive' | 'off';
  readonly role: 'status' | 'alert' | 'none';
}

/**
 * Resolves accessible screen-reader live announcements for Workspace semantic states.
 *
 * Keeps announcements concise and truthful without constantly overwhelming the user.
 */
export function resolveSemanticStateAnnouncement(
  state: WorkspaceSemanticState,
  context?: { domainName?: string; resourceName?: string }
): StateAnnouncementDescriptor {
  const domainPrefix = context?.domainName ? `${context.domainName}: ` : '';
  switch (state) {
    case 'LOADING':
      return {
        message: `${domainPrefix}Accessing infrastructure intelligence.`,
        ariaLive: 'polite',
        role: 'status',
      };

    case 'ERROR':
      return {
        message: 'Something went wrong. Retry available.',
        ariaLive: 'assertive',
        role: 'alert',
      };

    case 'UNAVAILABLE':
      return {
        message: 'This information is not currently available in this context.',
        ariaLive: 'polite',
        role: 'status',
      };

    case 'PARTIAL':
      return {
        message: 'Some infrastructure observations could not be established. Known signals remain visible.',
        ariaLive: 'polite',
        role: 'status',
      };

    case 'QUIET':
      return {
        message: 'Infrastructure observed and verified stable with zero changes.',
        ariaLive: 'polite',
        role: 'status',
      };

    case 'EMPTY':
      return {
        message: 'No established infrastructure baseline exists yet.',
        ariaLive: 'polite',
        role: 'status',
      };

    case 'READY':
    default:
      return {
        message: '',
        ariaLive: 'off',
        role: 'none',
      };
  }
}

/**
 * Formats technical identifiers with full accessible names to prevent screen reader ambiguity.
 */
export function formatAccessibleTechnicalIdentifier(
  kind: 'Snapshot ID' | 'Finding ID' | 'Change ID' | 'Correlation ID' | 'IP Address',
  value: string,
  truncateLength = 12
): {
  readonly display: string;
  readonly ariaLabel: string;
} {
  const display =
    value.length > truncateLength ? `${value.slice(0, truncateLength)}…` : value;

  return {
    display,
    ariaLabel: `${kind}: ${value}`,
  };
}

/**
 * Guarantees color-independent representation of finding severity tiers.
 *
 * Sourced strictly from the 6-tier canonical severity vocabulary (WX-006).
 */
export function getSeverityAccessibleDescriptor(severity: FindingSeverity): {
  readonly label: string;
  readonly ariaLabel: string;
  readonly visualPrefix: string;
} {
  switch (severity) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        ariaLabel: 'Critical severity finding requiring immediate intervention',
        visualPrefix: '✕',
      };
    case 'HIGH':
      return {
        label: 'High',
        ariaLabel: 'High severity finding',
        visualPrefix: '▲',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        ariaLabel: 'Medium severity finding',
        visualPrefix: '■',
      };
    case 'LOW':
      return {
        label: 'Low',
        ariaLabel: 'Low severity finding',
        visualPrefix: '▼',
      };
    case 'INFORMATIONAL':
      return {
        label: 'Informational',
        ariaLabel: 'Informational finding',
        visualPrefix: 'ℹ',
      };
    case 'SUCCESS':
    default:
      return {
        label: 'Success',
        ariaLabel: 'Verified healthy finding',
        visualPrefix: '✓',
      };
  }
}
