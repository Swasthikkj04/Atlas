import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react';
import { Icon } from '../../icons';
import { Typography } from '../../typography';
import type { FeedbackProps, FeedbackSeverity } from './Feedback.types';

const SEVERITY_CONFIG: Record<
  FeedbackSeverity,
  {
    icon: typeof Info;
    containerClass: string;
    iconClass: string;
    textVariant: 'info' | 'success' | 'medium' | 'critical';
  }
> = {
  info: {
    icon: Info,
    containerClass: 'bg-severity-info-bg border-severity-info-border text-foreground',
    iconClass: 'text-severity-info',
    textVariant: 'info',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'bg-severity-success-bg border-severity-success-border text-foreground',
    iconClass: 'text-severity-success',
    textVariant: 'success',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-severity-medium-bg border-severity-medium-border text-foreground',
    iconClass: 'text-severity-medium',
    textVariant: 'medium',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'bg-severity-critical-bg border-severity-critical-border text-foreground',
    iconClass: 'text-severity-critical',
    textVariant: 'critical',
  },
};

/**
 * Authoritative Feedback Primitive.
 *
 * Restrained status messaging consuming the 6-tier semantic severity scale.
 * Avoids full-bleed neon color splashes and loud celebratory animations.
 */
export const Feedback: React.FC<FeedbackProps> = ({
  severity = 'info',
  title,
  description,
  onDismiss,
  children,
  className = '',
  ...rest
}) => {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  const SeverityIcon = config.icon;

  return (
    <div
      role="status"
      className={`w-full p-3.5 rounded-lg border flex items-start gap-3 transition-all ${config.containerClass} ${className}`}
      {...rest}
    >
      <Icon icon={SeverityIcon} size="small" className={`flex-shrink-0 mt-0.5 ${config.iconClass}`} />

      <div className="flex-1 space-y-0.5 min-w-0">
        {title && (
          <Typography role="BodySmall" className="font-medium leading-snug">
            {title}
          </Typography>
        )}
        {description && (
          <Typography role="Caption" variant="muted" className="leading-relaxed">
            {description}
          </Typography>
        )}
        {children}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/40 transition-colors focus-ring cursor-pointer"
        >
          <Icon icon={X} size="micro" />
        </button>
      )}
    </div>
  );
};

Feedback.displayName = 'Feedback';

/**
 * Restrained success feedback shorthand.
 */
export const SuccessFeedback: React.FC<Omit<FeedbackProps, 'severity'>> = (props) => (
  <Feedback severity="success" {...props} />
);
