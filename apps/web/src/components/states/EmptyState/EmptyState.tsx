import React from 'react';
import { Layers } from 'lucide-react';
import { Icon } from '../../icons';
import { Typography } from '../../typography';
import { Stack, Cluster } from '../../layout';
import type { EmptyStateProps } from './EmptyState.types';

/**
 * Authoritative Empty State Primitive.
 *
 * Communicates that nothing has been created or observed yet.
 * Distinct from QuietState (where observation was performed and nothing changed).
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = Layers,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`w-full p-8 rounded-xl border border-dashed border-border bg-card/30 flex flex-col items-center justify-center text-center ${className}`}
      {...rest}
    >
      <Stack gap="md" align="center" className="max-w-md">
        <div className="w-10 h-10 rounded-xl border border-border/80 bg-muted/50 flex items-center justify-center text-muted-foreground shadow-sm">
          <Icon icon={icon} size="default" stroke="ui" />
        </div>

        <Stack gap="xs" align="center">
          <Typography role="CardTitle" variant="default" className="text-foreground font-medium">
            {title}
          </Typography>

          {description && (
            <Typography role="BodySmall" variant="muted" className="leading-relaxed">
              {description}
            </Typography>
          )}
        </Stack>

        {(actionLabel || secondaryActionLabel || children) && (
          <Cluster gap="sm" justify="center" className="pt-2">
            {actionLabel && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-ring cursor-pointer"
              >
                {actionLabel}
              </button>
            )}

            {secondaryActionLabel && onSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-medium transition-colors focus-ring cursor-pointer"
              >
                {secondaryActionLabel}
              </button>
            )}

            {children}
          </Cluster>
        )}
      </Stack>
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
