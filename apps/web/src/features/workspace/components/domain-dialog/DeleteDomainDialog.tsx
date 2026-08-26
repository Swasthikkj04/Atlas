import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { DomainDto } from '../../../../types/api';

export interface DeleteDomainDialogProps {
  readonly domain: DomainDto | null;
  readonly isOpen: boolean;
  readonly isDeleting?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Authoritative Delete Domain Confirmation Dialog.
 *
 * Provides a controlled, calm, and unambiguous confirmation flow
 * when removing a domain and its associated infrastructure intelligence.
 */
export const DeleteDomainDialog: React.FC<DeleteDomainDialogProps> = ({
  domain,
  isOpen,
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !domain) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[1000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-domain-title"
        aria-describedby="delete-domain-description"
        className="w-full max-w-[460px] bg-card/95 border border-border/80 rounded-2xl p-7 shadow-2xl backdrop-blur-xl relative space-y-6"
      >
        {/* Dismiss Button */}
        {!isDeleting && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close delete dialog"
            className="absolute top-5 right-5 p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors focus-ring cursor-pointer"
          >
            <Icon icon={X} size="small" />
          </button>
        )}

        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <Icon icon={AlertTriangle} size="default" />
          </div>

          <h2
            id="delete-domain-title"
            className="font-display font-normal text-2xl text-foreground"
          >
            Delete domain?
          </h2>

          <div className="p-3 bg-surface-subtle border border-border-hairline rounded-lg font-mono text-sm text-foreground">
            {domain.domainName}
          </div>

          <p
            id="delete-domain-description"
            className="text-sm text-muted-foreground leading-relaxed"
          >
            This will remove this domain and its associated infrastructure intelligence
            from your workspace.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-ring cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground text-xs font-medium px-4 py-2.5 rounded-xl hover:opacity-90 active:opacity-75 transition-all shadow-[0_2px_8px_rgba(220,38,38,0.25)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-ring"
          >
            {isDeleting ? 'Deleting...' : 'Delete domain'}
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteDomainDialog.displayName = 'DeleteDomainDialog';
