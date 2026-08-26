import {
  ApiError,
  NotFoundError,
  InsufficientSignalError,
  NetworkError,
} from '../../../lib/api-client.ts';

export type DomainEntryErrorKind =
  | 'NONEXISTENT_DOMAIN'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR';

export interface DomainEntryErrorState {
  readonly kind: DomainEntryErrorKind;
  readonly title: string;
  readonly description: string;
  readonly canEditDomain: boolean;
  readonly canRetry: boolean;
}

export const DOMAIN_ENTRY_ERROR_COPY = {
  NONEXISTENT_DOMAIN: {
    title: 'Unable to reach this domain.',
    description: 'Check the address and try again.',
  },
  NETWORK_ERROR: {
    title: 'Unable to reach Nebula.',
    description: 'Check your connection and try again.',
  },
  SERVER_ERROR: {
    title: 'Something went wrong.',
    description: 'An unexpected error occurred. Please try again.',
  },
} as const;

/**
 * Pure deterministic resolver that translates authoritative backend understanding/API failures
 * into calm, human-readable product error states.
 *
 * Invariants:
 * 1. React does NOT perform client-side DNS checks or synthesize existence logic.
 * 2. Preserves strict distinctions between:
 *    - Unresolvable/unreachable domain -> "We couldn't find that domain."
 *    - Backend/server error -> "Something went wrong. Try again."
 *    - Network/connectivity failure -> "Unable to reach Nebula. Check your connection."
 * 3. Never exposes raw "API Error 404: Not Found" or generic "Failed to understand domain".
 */
export function resolveDomainEntryError(
  error: unknown,
  jobError?: string | null
): DomainEntryErrorState {
  // 1. Check job error string if provided
  if (jobError) {
    const lower = jobError.toLowerCase();
    if (
      lower.includes('not found') ||
      lower.includes('enotfound') ||
      lower.includes('nxdomain') ||
      lower.includes('dns') ||
      lower.includes('unreachable') ||
      lower.includes('cannot resolve') ||
      lower.includes('does not exist') ||
      lower.includes('no answer') ||
      lower.includes('insufficient_signal')
    ) {
      return {
        kind: 'NONEXISTENT_DOMAIN',
        title: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.title,
        description: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.description,
        canEditDomain: true,
        canRetry: true,
      };
    }
  }

  // 2. Check typed API client errors
  if (error instanceof InsufficientSignalError || error instanceof NotFoundError) {
    return {
      kind: 'NONEXISTENT_DOMAIN',
      title: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.title,
      description: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.description,
      canEditDomain: true,
      canRetry: true,
    };
  }

  if (error instanceof NetworkError) {
    return {
      kind: 'NETWORK_ERROR',
      title: DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.title,
      description: DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.description,
      canEditDomain: true,
      canRetry: true,
    };
  }

  if (error instanceof ApiError) {
    if (
      error.status === 404 ||
      error.status === 422 ||
      error.code === 'DOMAIN_INSUFFICIENT_SIGNAL' ||
      error.code === 'DOMAIN_UNREACHABLE' ||
      error.code === 'DOMAIN_INVALID' ||
      error.code === 'NOT_FOUND'
    ) {
      return {
        kind: 'NONEXISTENT_DOMAIN',
        title: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.title,
        description: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.description,
        canEditDomain: true,
        canRetry: true,
      };
    }

    if (error.status === 0 || error.code === 'NETWORK_FAILURE') {
      return {
        kind: 'NETWORK_ERROR',
        title: DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.title,
        description: DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.description,
        canEditDomain: true,
        canRetry: true,
      };
    }
  }

  // 3. Check Error message heuristics for fetch / network failure
  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (
      lower.includes('404') ||
      lower.includes('not found') ||
      lower.includes('enotfound') ||
      lower.includes('nxdomain') ||
      lower.includes('unreachable')
    ) {
      return {
        kind: 'NONEXISTENT_DOMAIN',
        title: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.title,
        description: DOMAIN_ENTRY_ERROR_COPY.NONEXISTENT_DOMAIN.description,
        canEditDomain: true,
        canRetry: true,
      };
    }

    if (
      lower.includes('network') ||
      lower.includes('failed to fetch') ||
      lower.includes('connection')
    ) {
      return {
        kind: 'NETWORK_ERROR',
        title: DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.title,
        description: DOMAIN_ENTRY_ERROR_COPY.NETWORK_ERROR.description,
        canEditDomain: true,
        canRetry: true,
      };
    }
  }

  // 4. Fallback to generic server/system error
  return {
    kind: 'SERVER_ERROR',
    title: DOMAIN_ENTRY_ERROR_COPY.SERVER_ERROR.title,
    description: DOMAIN_ENTRY_ERROR_COPY.SERVER_ERROR.description,
    canEditDomain: true,
    canRetry: true,
  };
}
