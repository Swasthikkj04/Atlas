import React from 'react';
import {
  AlertCircle,
  WifiOff,
  ShieldAlert,
  FileQuestion,
  Clock,
  Radio,
  RefreshCw,
} from 'lucide-react';
import {
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  InsufficientSignalError,
  RateLimitError,
} from '../../../lib/api-client';
import { Icon } from '../../icons';
import { Typography } from '../../typography';
import { Stack, Cluster } from '../../layout';
import type { ErrorStateProps, ErrorType } from './ErrorState.types';

function resolveErrorPresentation(
  error?: Error | ApiError | null,
  overrideType?: ErrorType
): { type: ErrorType; title: string; description: string; icon: typeof AlertCircle } {
  if (overrideType) {
    switch (overrideType) {
      case 'network':
        return {
          type: 'network',
          title: 'Network connection interrupted.',
          description: 'Nebula cannot reach the verification backend. Check your connection.',
          icon: WifiOff,
        };
      case 'authentication':
        return {
          type: 'authentication',
          title: 'Session authentication required.',
          description: 'Your session has expired. Please sign in again to continue.',
          icon: ShieldAlert,
        };
      case 'authorization':
        return {
          type: 'authorization',
          title: 'Access restricted.',
          description: 'You do not have sufficient permissions to view this resource.',
          icon: ShieldAlert,
        };
      case 'not-found':
        return {
          type: 'not-found',
          title: 'Resource not found.',
          description: 'The requested infrastructure entity or story does not exist.',
          icon: FileQuestion,
        };
      case 'rate-limit':
        return {
          type: 'rate-limit',
          title: 'Rate limit reached.',
          description: 'Too many queries have been submitted. Please wait a moment before retrying.',
          icon: Clock,
        };
      case 'insufficient-signal':
        return {
          type: 'insufficient-signal',
          title: 'Insufficient infrastructure signal.',
          description: 'Nebula could not establish verifiable infrastructure observations for this target.',
          icon: Radio,
        };
      default:
        return {
          type: 'generic',
          title: 'Unable to complete operation.',
          description: 'An unexpected error occurred while processing this view.',
          icon: AlertCircle,
        };
    }
  }

  if (error instanceof NetworkError) {
    return resolveErrorPresentation(null, 'network');
  }
  if (error instanceof AuthenticationError) {
    return resolveErrorPresentation(null, 'authentication');
  }
  if (error instanceof AuthorizationError) {
    return resolveErrorPresentation(null, 'authorization');
  }
  if (error instanceof NotFoundError) {
    return resolveErrorPresentation(null, 'not-found');
  }
  if (error instanceof RateLimitError) {
    return resolveErrorPresentation(null, 'rate-limit');
  }
  if (error instanceof InsufficientSignalError) {
    return resolveErrorPresentation(null, 'insufficient-signal');
  }
  if (error instanceof ApiError) {
    if (error.status === 401) return resolveErrorPresentation(null, 'authentication');
    if (error.status === 403) return resolveErrorPresentation(null, 'authorization');
    if (error.status === 404) return resolveErrorPresentation(null, 'not-found');
    if (error.status === 422) return resolveErrorPresentation(null, 'insufficient-signal');
    if (error.status === 429) return resolveErrorPresentation(null, 'rate-limit');
  }

  return {
    type: 'generic',
    title: 'Unable to complete operation.',
    description: error?.message || 'An unexpected error occurred while processing this view.',
    icon: AlertCircle,
  };
}

/**
 * Authoritative Error State Primitive.
 *
 * Differentiates technical failure categories with calm, human-readable explanations.
 * Reuses the WX-001 ApiError hierarchy and WX-002 restrained severity tokens.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  type,
  title: overrideTitle,
  description: overrideDescription,
  errorId,
  retryLabel = 'Try Again',
  onRetry,
  secondaryLabel,
  onSecondaryAction,
  className = '',
  ...rest
}) => {
  const presentation = resolveErrorPresentation(error, type);
  const title = overrideTitle || presentation.title;
  const description = overrideDescription || presentation.description;
  const ErrorIcon = presentation.icon;

  return (
    <div
      role="alert"
      className={`w-full p-6 sm:p-8 rounded-xl border border-severity-critical-border bg-severity-critical-bg/50 flex flex-col items-center justify-center text-center ${className}`}
      {...rest}
    >
      <Stack gap="md" align="center" className="max-w-md">
        {/* Status Emblem */}
        <div className="w-10 h-10 rounded-xl border border-severity-critical-border bg-severity-critical-bg flex items-center justify-center text-severity-critical shadow-sm">
          <Icon icon={ErrorIcon} size="default" stroke="ui" />
        </div>

        {/* Narrative & Description */}
        <Stack gap="xs" align="center">
          <Typography role="CardTitle" variant="default" className="text-foreground font-medium">
            {title}
          </Typography>

          <Typography role="BodySmall" variant="muted" className="leading-relaxed">
            {description}
          </Typography>
        </Stack>

        {/* Reference Error ID */}
        {errorId && (
          <div className="px-2.5 py-1 rounded bg-muted/60 border border-border/80 font-mono text-[11px] text-muted-foreground">
            Ref: {errorId}
          </div>
        )}

        {/* Recovery CTAs */}
        {(onRetry || onSecondaryAction) && (
          <Cluster gap="sm" justify="center" className="pt-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-ring cursor-pointer"
              >
                <Icon icon={RefreshCw} size="micro" />
                <span>{retryLabel}</span>
              </button>
            )}

            {secondaryLabel && onSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-medium transition-colors focus-ring cursor-pointer"
              >
                {secondaryLabel}
              </button>
            )}
          </Cluster>
        )}
      </Stack>
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
