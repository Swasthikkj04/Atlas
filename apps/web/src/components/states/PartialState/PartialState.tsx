import React from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Icon } from '../../icons';
import { Typography } from '../../typography';
import { Cluster } from '../../layout';
import type { PartialStateProps } from './PartialState.types';

/**
 * Authoritative Partial Understanding State Primitive.
 *
 * Distinctly separates established knowledge from unverified details,
 * preserving honesty and preventing false certainty.
 */
export const PartialState: React.FC<PartialStateProps> = ({
  title = 'Partial understanding established.',
  established,
  unverified,
  inspectLabel = 'Inspect evidence lineage',
  onInspectEvidence,
  className = '',
  ...rest
}) => {
  const establishedItems = Array.isArray(established) ? established : [established];
  const unverifiedItems = Array.isArray(unverified) ? unverified : [unverified];

  return (
    <div
      className={`w-full p-6 rounded-xl border border-border bg-card/60 flex flex-col space-y-5 ${className}`}
      {...rest}
    >
      {/* Header */}
      <Cluster gap="sm" align="center">
        <div className="w-8 h-8 rounded-lg border border-severity-info-border bg-severity-info-bg flex items-center justify-center text-severity-info shadow-sm">
          <Icon icon={HelpCircle} size="small" stroke="ui" />
        </div>
        <Typography role="CardTitle" variant="default" className="text-foreground font-medium">
          {title}
        </Typography>
      </Cluster>

      {/* Two-Column Understanding Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Established Section */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/70 space-y-2">
          <Cluster gap="xs" align="center">
            <Icon icon={CheckCircle2} size="micro" className="text-severity-success" />
            <Typography role="Eyebrow" variant="muted" className="text-[11px]">
              Established Observations
            </Typography>
          </Cluster>
          <ul className="space-y-1.5 list-disc list-inside text-xs text-foreground/90 font-sans leading-relaxed">
            {establishedItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Unverified Section */}
        <div className="p-4 rounded-lg bg-severity-medium-bg border border-severity-medium-border space-y-2">
          <Cluster gap="xs" align="center">
            <Icon icon={AlertCircle} size="micro" className="text-severity-medium" />
            <Typography role="Eyebrow" variant="medium" className="text-[11px]">
              Unverified / Missing Signals
            </Typography>
          </Cluster>
          <ul className="space-y-1.5 list-disc list-inside text-xs text-foreground/90 font-sans leading-relaxed">
            {unverifiedItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      {onInspectEvidence && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onInspectEvidence}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium focus-ring cursor-pointer"
          >
            <span>{inspectLabel}</span>
            <Icon icon={ArrowRight} size="micro" />
          </button>
        </div>
      )}
    </div>
  );
};

PartialState.displayName = 'PartialState';
