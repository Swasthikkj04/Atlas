/**
 * Authoritative Unavailable Infrastructure Contract (WX-703).
 *
 * Distinctly classifies why an infrastructure entity or intelligence view cannot legitimately
 * be provided, strictly separating domain/security boundaries and uncaptured evidence from
 * system errors, empty baselines, or partial intelligence.
 */

export type UnavailableReason =
  | 'CROSS_DOMAIN_BOUNDARY'
  | 'UNAUTHORIZED_RESOURCE'
  | 'CAPABILITY_UNSUPPORTED'
  | 'EVIDENCE_UNAVAILABLE'
  | 'HISTORICAL_CONTEXT_UNAVAILABLE'
  | 'RESOURCE_NOT_FOUND';

export interface UnavailableContextDescriptor {
  readonly reason: UnavailableReason;
  readonly title: string;
  readonly description: string;
  readonly returnTarget: string;
  readonly returnLabel: string;
}

export interface ResolveUnavailableParams {
  readonly reason: UnavailableReason;
  readonly activeDomainName?: string;
  readonly returnPath?: string;
  readonly sourceExperience?: string;
}

/**
 * Pure, authoritative unavailable context resolver.
 *
 * Invariant: Foreign domain resources NEVER reveal foreign metadata (P0 Security).
 */
export function resolveUnavailableContext(
  params: ResolveUnavailableParams
): UnavailableContextDescriptor {
  const { reason, returnPath = '/workspace', sourceExperience = 'Workspace' } = params;

  switch (reason) {
    case 'CROSS_DOMAIN_BOUNDARY':
    case 'UNAUTHORIZED_RESOURCE':
      return {
        reason,
        title: 'Resource unavailable in active domain.',
        description:
          'This infrastructure intelligence cannot legitimately be accessed from the current domain context.',
        returnTarget: '/workspace',
        returnLabel: 'Return to Active Workspace',
      };

    case 'EVIDENCE_UNAVAILABLE':
      return {
        reason,
        title: 'Supporting evidence unavailable.',
        description:
          'Nebula verified this observation fact, but deep protocol evidence was not captured during discovery.',
        returnTarget: returnPath,
        returnLabel: `Back to ${sourceExperience}`,
      };

    case 'HISTORICAL_CONTEXT_UNAVAILABLE':
      return {
        reason,
        title: 'Historical context unavailable.',
        description:
          'Temporal evolution telemetry is not currently available for this infrastructure snapshot.',
        returnTarget: returnPath,
        returnLabel: `Back to ${sourceExperience}`,
      };

    case 'CAPABILITY_UNSUPPORTED':
      return {
        reason,
        title: 'Observation capability unavailable.',
        description:
          'This specific discovery capability was not available during automated telemetry capture.',
        returnTarget: returnPath,
        returnLabel: `Back to ${sourceExperience}`,
      };

    case 'RESOURCE_NOT_FOUND':
    default:
      return {
        reason: 'RESOURCE_NOT_FOUND',
        title: 'Information currently unavailable.',
        description:
          'The requested infrastructure intelligence is not available in the current context.',
        returnTarget: returnPath,
        returnLabel: `Back to ${sourceExperience}`,
      };
  }
}
