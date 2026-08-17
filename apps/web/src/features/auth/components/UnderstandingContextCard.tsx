import React from 'react';
import { Globe } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

const MONO = "'JetBrains Mono', 'Courier New', monospace";

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
        <div className="w-7 h-7 rounded-lg border border-border flex items-center justify-center flex-shrink-0 mt-0.5 bg-background">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p
            style={{ fontFamily: MONO }}
            className="text-sm font-medium text-foreground leading-tight truncate"
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
          style={{ fontFamily: MONO }}
          className="text-[11px] text-muted-foreground"
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};
