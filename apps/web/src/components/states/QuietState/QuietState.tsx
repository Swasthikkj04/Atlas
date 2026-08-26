import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Icon } from '../../icons';
import { Typography } from '../../typography';
import { Stack, Cluster } from '../../layout';
import type { QuietStateProps } from './QuietState.types';

/**
 * Authoritative Quiet State Primitive.
 *
 * Communicates that infrastructure was actively evaluated and no meaningful
 * changes or risks require user attention.
 *
 * INVARIANT: Silence is valuable. Must NEVER be styled like a warning or alarm.
 */
export const QuietState: React.FC<QuietStateProps> = ({
  title = 'Nothing important changed.',
  description = 'Nebula verified your infrastructure. All components remain in their established baseline states.',
  lastVerifiedAt,
  stableCount,
  compact = false,
  className = '',
  ...rest
}) => {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border/80 bg-muted/20 text-muted-foreground ${className}`}
        {...rest}
      >
        <Icon icon={ShieldCheck} size="small" className="text-muted-foreground/80 flex-shrink-0" />
        <Typography role="BodySmall" variant="muted" className="text-xs">
          {title}
        </Typography>
        {lastVerifiedAt && (
          <Typography role="TechnicalSmall" variant="subtle" className="text-[11px] ml-auto">
            {lastVerifiedAt}
          </Typography>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full p-6 sm:p-8 rounded-xl border border-border bg-card/50 flex flex-col items-center justify-center text-center ${className}`}
      {...rest}
    >
      <Stack gap="md" align="center" className="max-w-lg">
        {/* Calm Status Emblem */}
        <div className="w-10 h-10 rounded-xl border border-border bg-muted/40 flex items-center justify-center text-muted-foreground shadow-sm">
          <Icon icon={ShieldCheck} size="default" stroke="ui" />
        </div>

        {/* Narrative & Description */}
        <Stack gap="xs" align="center">
          <Typography role="CardTitle" variant="default" className="text-foreground font-medium">
            {title}
          </Typography>

          <Typography role="Body" variant="muted" className="text-sm leading-relaxed max-w-md">
            {description}
          </Typography>
        </Stack>

        {/* Metadata Footer */}
        {(lastVerifiedAt || stableCount !== undefined) && (
          <Cluster gap="sm" justify="center" align="center" className="pt-1">
            {stableCount !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/80 font-mono text-[11px] text-muted-foreground tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-severity-success" />
                <span>{stableCount} components stable</span>
              </span>
            )}

            {lastVerifiedAt && (
              <span className="font-mono text-[11px] text-muted-foreground/80">
                Verified: {lastVerifiedAt}
              </span>
            )}
          </Cluster>
        )}
      </Stack>
    </div>
  );
};

QuietState.displayName = 'QuietState';
