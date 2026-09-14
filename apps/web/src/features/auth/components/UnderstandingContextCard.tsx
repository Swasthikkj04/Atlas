import React from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { DomainFavicon } from '../../workspace/components/identity/DomainFavicon';

export interface GuestUnderstandingContext {
  domain: string;
  understandingType?: string;
  expiresAt?: Date | null;
}

export interface UnderstandingContextCardProps {
  context: GuestUnderstandingContext;
  step?: 'register' | 'check-email' | 'login' | 'verify';
}

export const UnderstandingContextCard: React.FC<UnderstandingContextCardProps> = ({
  context,
  step = 'register',
}) => {
  const timeRemaining = useCountdown(context.expiresAt);
  const expired = timeRemaining === 'expired';
  const pending = step === 'check-email' || step === 'verify';

  const statusLabel = pending
    ? expired
      ? 'Verification pending · session expired'
      : `Verification pending · expires in ${timeRemaining}`
    : expired
      ? 'Guest session · expired'
      : `Guest session · expires in ${timeRemaining}`;

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card/50 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Domain row */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-3">
        <DomainFavicon domain={context.domain} size="secondary" className="mt-0.5" />
        <div className="min-w-0">
          <p
            className="font-mono text-sm font-medium text-foreground leading-tight truncate"
          >
            {context.domain}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {context.understandingType || 'Infrastructure Understanding'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Session status */}
      <div className="px-5 py-3.5 flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            expired ? 'bg-destructive' : 'bg-amber-500'
          }`}
        />
        <span
          className="font-mono text-[11px] text-muted-foreground"
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};
