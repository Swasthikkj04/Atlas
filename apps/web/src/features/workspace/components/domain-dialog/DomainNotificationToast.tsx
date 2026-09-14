import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Icon } from '../../../../components/icons';

export interface DomainNotificationToastProps {
  readonly message: string | null;
  readonly type?: 'success' | 'error' | 'warning' | 'info';
  readonly title?: string;
  readonly onClose: () => void;
  readonly durationMs?: number;
}

/**
 * Universal Workspace Notification Toast (WX-812 & SEC-GXWX-003).
 *
 * Displays calm, reassuring or cautionary feedback (e.g. domain limit reached,
 * deletion confirmation, quota status) at the bottom of the screen.
 */
export const DomainNotificationToast: React.FC<DomainNotificationToastProps> = ({
  message,
  type = 'info',
  title,
  onClose,
  durationMs = 6000,
}) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [message, onClose, durationMs]);

  if (!message) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="fixed bottom-6 inset-x-0 z-[1100] flex justify-center px-4 pointer-events-none"
    >
      <div
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-card/95 text-card-foreground border rounded-2xl shadow-2xl backdrop-blur-xl max-w-lg w-full sm:w-auto transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          isError
            ? 'border-destructive/40 shadow-[0_4px_20px_rgba(239,68,68,0.15)]'
            : isWarning
            ? 'border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
            : isSuccess
            ? 'border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.12)]'
            : 'border-border/80'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
            isError
              ? 'bg-destructive/10 border-destructive/20 text-destructive'
              : isWarning
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              : isSuccess
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}
        >
          <Icon
            icon={
              isError
                ? AlertCircle
                : isWarning
                ? AlertTriangle
                : isSuccess
                ? CheckCircle2
                : Info
            }
            size="small"
          />
        </div>

        <div className="text-xs text-foreground leading-relaxed flex-1 pr-2">
          {title && <strong className="block font-medium mb-0.5">{title}</strong>}
          <span>{message}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
        >
          <Icon icon={X} size="small" />
        </button>
      </div>
    </div>
  );
};

DomainNotificationToast.displayName = 'DomainNotificationToast';
