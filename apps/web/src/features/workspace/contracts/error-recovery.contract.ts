import {
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
} from '../../../lib/api-client.ts';

/**
 * Authoritative Workspace Error Categories (WX-704).
 */
export type WorkspaceErrorCategory =
  | 'NETWORK_FAILURE'
  | 'TIMEOUT'
  | 'SESSION_EXPIRED'
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SERVER_FAILURE'
  | 'UNKNOWN';

export interface ErrorRecoveryDescriptor {
  readonly category: WorkspaceErrorCategory;
  readonly title: string;
  readonly description: string;
  readonly correlationId?: string;
  readonly isRetryable: boolean;
  readonly retryLabel?: string;
  readonly returnTarget: string;
  readonly returnLabel: string;
  readonly actionType: 'RETRY' | 'REAUTH' | 'NAVIGATE';
}

export interface ResolveErrorRecoveryParams {
  readonly error: unknown;
  readonly returnPath?: string;
  readonly sourceExperience?: string;
}

/**
 * Pure, authoritative error recovery resolver.
 * Maps API and runtime errors into actionable, context-preserving recovery descriptors.
 */
export function resolveErrorRecovery(
  params: ResolveErrorRecoveryParams
): ErrorRecoveryDescriptor {
  const { error, returnPath = '/workspace', sourceExperience = 'Workspace' } = params;

  let correlationId: string | undefined;
  if (error instanceof ApiError) {
    if (typeof error.details === 'object' && error.details !== null && 'correlationId' in error.details) {
      correlationId = String((error.details as Record<string, unknown>).correlationId);
    }
  }

  // 1. Network / Connection Interrupted
  if (error instanceof NetworkError) {
    return {
      category: 'NETWORK_FAILURE',
      title: 'Network connection interrupted.',
      description: 'Nebula cannot reach the verification backend. Check your network connection.',
      correlationId,
      isRetryable: true,
      retryLabel: 'Try Again',
      returnTarget: returnPath,
      returnLabel: `Back to ${sourceExperience}`,
      actionType: 'RETRY',
    };
  }

  // 2. Authentication / Session Expired
  if (error instanceof AuthenticationError || (error instanceof ApiError && error.status === 401)) {
    return {
      category: 'SESSION_EXPIRED',
      title: 'Session authentication required.',
      description: 'Your authenticated session has expired. Please sign in again to continue.',
      correlationId,
      isRetryable: false,
      returnTarget: '/auth/login',
      returnLabel: 'Sign In Again',
      actionType: 'REAUTH',
    };
  }

  // 3. Authorization / Access Denied
  if (error instanceof AuthorizationError || (error instanceof ApiError && error.status === 403)) {
    return {
      category: 'ACCESS_DENIED',
      title: 'Access restricted.',
      description: 'You do not have sufficient permissions to view this resource.',
      correlationId,
      isRetryable: false,
      returnTarget: returnPath,
      returnLabel: `Back to ${sourceExperience}`,
      actionType: 'NAVIGATE',
    };
  }

  // 4. Rate Limited
  if (error instanceof RateLimitError || (error instanceof ApiError && error.status === 429)) {
    return {
      category: 'RATE_LIMITED',
      title: 'Rate limit reached.',
      description: 'Too many queries have been submitted. Please wait a moment before retrying.',
      correlationId,
      isRetryable: true,
      retryLabel: 'Retry',
      returnTarget: returnPath,
      returnLabel: `Back to ${sourceExperience}`,
      actionType: 'RETRY',
    };
  }

  // 5. Not Found
  if (error instanceof NotFoundError || (error instanceof ApiError && error.status === 404)) {
    return {
      category: 'NOT_FOUND',
      title: 'Resource not found.',
      description: 'The requested infrastructure entity or snapshot record could not be found.',
      correlationId,
      isRetryable: false,
      returnTarget: returnPath,
      returnLabel: `Back to ${sourceExperience}`,
      actionType: 'NAVIGATE',
    };
  }

  // 6. 5xx Server Failure
  if (error instanceof ApiError && error.status >= 500) {
    return {
      category: 'SERVER_FAILURE',
      title: 'Unable to complete request.',
      description: 'The verification server encountered a temporary failure.',
      correlationId,
      isRetryable: true,
      retryLabel: 'Try Again',
      returnTarget: returnPath,
      returnLabel: `Back to ${sourceExperience}`,
      actionType: 'RETRY',
    };
  }

  // 7. Generic / Unknown Error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
  return {
    category: 'UNKNOWN',
    title: 'Unable to complete operation.',
    description: message,
    correlationId,
    isRetryable: true,
    retryLabel: 'Try Again',
    returnTarget: returnPath,
    returnLabel: `Back to ${sourceExperience}`,
    actionType: 'RETRY',
  };
}
