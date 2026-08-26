import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Icon } from '../../icons';
import { Typography } from '../../typography';
import { Stack } from '../../layout';
import type { UnavailableStateProps } from './UnavailableState.types';

/**
 * Authoritative Unavailable State Primitive.
 *
 * Communicates that evidence, historical metrics, or telemetry are currently
 * unavailable, without falsely claiming a system failure.
 */
export const UnavailableState: React.FC<UnavailableStateProps> = ({
  title = 'Information currently unavailable.',
  description = 'Nebula cannot currently access the requested evidence snapshot.',
  technicalNote,
  action,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`w-full p-6 sm:p-8 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center text-center ${className}`}
      {...rest}
    >
      <Stack gap="md" align="center" className="max-w-md">
        <div className="w-10 h-10 rounded-xl border border-border bg-card/60 flex items-center justify-center text-muted-foreground shadow-sm">
          <Icon icon={FileQuestion} size="default" stroke="ui" />
        </div>

        <Stack gap="xs" align="center">
          <Typography role="CardTitle" variant="default" className="text-foreground font-medium">
            {title}
          </Typography>

          <Typography role="BodySmall" variant="muted" className="leading-relaxed">
            {description}
          </Typography>
        </Stack>

        {technicalNote && (
          <div className="px-3 py-1.5 rounded-md bg-muted/40 border border-border font-mono text-[11px] text-muted-foreground">
            {technicalNote}
          </div>
        )}

        {action && <div className="pt-2">{action}</div>}
      </Stack>
    </div>
  );
};

UnavailableState.displayName = 'UnavailableState';
