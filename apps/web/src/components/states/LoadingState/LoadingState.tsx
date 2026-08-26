import React from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from '../../icons';
import { Typography } from '../../typography';
import { Stack, Cluster } from '../../layout';
import type { LoadingStateProps, LoadingStateSize } from './LoadingState.types';

const ICON_SIZE_MAP: Record<LoadingStateSize, 'small' | 'default' | 'medium'> = {
  sm: 'small',
  md: 'default',
  lg: 'medium',
};

/**
 * Authoritative Loading State Primitive.
 *
 * Communicates background retrieval or computation with calm restraint.
 * Strictly avoids fake progress bars, fake percentages, or distracting animation.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Understanding infrastructure...',
  description,
  size = 'md',
  centered = true,
  inline = false,
  className = '',
  ...rest
}) => {
  const iconSize = ICON_SIZE_MAP[size] || 'default';

  if (inline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 text-muted-foreground ${className}`}
        {...rest}
      >
        <Icon icon={Loader2} size={iconSize} className="animate-spin text-muted-foreground" />
        <Typography role="BodySmall" variant="muted">
          {label}
        </Typography>
      </div>
    );
  }

  const containerClass = centered
    ? 'flex flex-col items-center justify-center min-h-[160px] text-center p-6'
    : 'flex flex-col items-start p-4';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${containerClass} ${className}`}
      {...rest}
    >
      <Stack gap="sm" align={centered ? 'center' : 'start'} className="max-w-md">
        <Cluster gap="xs" align="center" justify={centered ? 'center' : 'start'}>
          <div className="w-8 h-8 rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center shadow-sm">
            <Icon icon={Loader2} size={iconSize} className="animate-spin text-muted-foreground" />
          </div>
        </Cluster>

        <Typography role="Body" variant="default" className="font-medium text-foreground">
          {label}
        </Typography>

        {description && (
          <Typography role="Caption" variant="muted">
            {description}
          </Typography>
        )}
      </Stack>
    </div>
  );
};

LoadingState.displayName = 'LoadingState';
