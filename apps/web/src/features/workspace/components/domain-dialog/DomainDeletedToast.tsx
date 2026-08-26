import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Icon } from '../../../../components/icons';

export interface DomainDeletedToastProps {
  readonly domainName: string | null;
  readonly onClose: () => void;
  readonly durationMs?: number;
}

/**
 * Bottom Floating Toast Notification for Successful Domain Deletion.
 *
 * Displays a calm, reassuring confirmation at the bottom of the screen
 * when a domain is removed from the workspace.
 */
export const DomainDeletedToast: React.FC<DomainDeletedToastProps> = ({
  domainName,
  onClose,
  durationMs = 4500,
}) => {
  useEffect(() => {
    if (!domainName) return;

    const timer = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [domainName, onClose, durationMs]);

  if (!domainName) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 inset-x-0 z-[1100] flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-card/95 text-card-foreground border border-border/80 rounded-2xl shadow-2xl backdrop-blur-xl max-w-md w-full sm:w-auto transition-all animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
          <Icon icon={CheckCircle2} size="small" />
        </div>

        <div className="text-xs text-foreground leading-relaxed flex-1 pr-2">
          Domain <span className="font-mono font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">{domainName}</span> deleted successfully.
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

DomainDeletedToast.displayName = 'DomainDeletedToast';
