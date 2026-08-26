import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight, X } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { LoadingState } from '../../../../components/states';
import { useCreateDomain } from '../../../../hooks/queries/useDomains';
import { useTriggerUnderstanding, useUnderstandingJob } from '../../../../hooks/queries/useUnderstanding';
import {
  resolveDomainEntryError,
  type DomainEntryErrorState,
} from '../../contracts/domain-entry-error.contract';
import type { DomainEntryDialogProps } from './DomainEntryDialog.types';
import type { DomainDto } from '../../../../types/api';

/**
 * Authoritative Domain Entry Dialog (WX-210-F / WX-211 / Nonexistent Domain UX Correction).
 *
 * Reusable, focused domain-entry interaction across the Workspace,
 * preserving Nebula's editorial visual DNA from the Guest Experience:
 * - Newsreader editorial headline typography with restrained italic inflection
 * - Refined geometry and hairline borders
 * - First Domain (0 domains): Centered focused interaction in the canvas.
 * - Additional Domain (existing domains): Modal dialog triggered from Workspace actions.
 * - Calm, human-readable error states ("We couldn't find that domain.") without raw HTTP/API text.
 * - Preserves domain input state on error so users can easily edit typos and retry.
 */
export const DomainEntryDialog: React.FC<DomainEntryDialogProps> = ({
  isFirstDomain = true,
  isDismissable = !isFirstDomain,
  isModal = !isFirstDomain,
  onDomainEstablished,
  onClose,
  className = '',
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<DomainEntryErrorState | null>(null);
  const [establishedDomain, setEstablishedDomain] = useState<DomainDto | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const createDomainMutation = useCreateDomain();
  const triggerUnderstandingMutation = useTriggerUnderstanding();
  const understandingJobQuery = useUnderstandingJob(activeJobId);

  const isCreating = createDomainMutation.isPending || triggerUnderstandingMutation.isPending;
  const jobStatus = understandingJobQuery.data?.status;

  // Track job completion and notify parent
  useEffect(() => {
    if (jobStatus === 'COMPLETED' && establishedDomain && onDomainEstablished) {
      onDomainEstablished(establishedDomain);
    }
  }, [jobStatus, establishedDomain, onDomainEstablished]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setEntryError(null);

    const raw = domainInput.trim();
    if (!raw) {
      setValidationError('Please enter a valid domain name.');
      return;
    }

    // Clean protocol and trailing paths for canonical domain format
    const sanitized = raw.replace(/^https?:\/\//i, '').split('/')[0].trim();
    if (!sanitized || !sanitized.includes('.')) {
      setValidationError('Domain must include a valid top-level domain (e.g. stripe.com).');
      return;
    }

    try {
      const created = await createDomainMutation.mutateAsync({ domainName: sanitized });
      setEstablishedDomain(created);

      const jobResponse = await triggerUnderstandingMutation.mutateAsync(created.id);
      const jobId = jobResponse?.id || jobResponse?.jobId;
      if (jobId) {
        setActiveJobId(jobId);
      }
    } catch (err: unknown) {
      const resolved = resolveDomainEntryError(err);
      setEntryError(resolved);
    }
  };

  const handleEditDomain = () => {
    setEntryError(null);
    setActiveJobId(null);
    setEstablishedDomain(null);
    setValidationError(null);
  };

  const handleRetry = async () => {
    setEntryError(null);
    if (establishedDomain) {
      try {
        const jobResponse = await triggerUnderstandingMutation.mutateAsync(establishedDomain.id);
        const jobId = jobResponse?.id || jobResponse?.jobId;
        if (jobId) {
          setActiveJobId(jobId);
        }
      } catch (err: unknown) {
        setEntryError(resolveDomainEntryError(err));
      }
    } else {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
    }
  };

  const currentErrorState: DomainEntryErrorState | null =
    entryError ||
    (jobStatus === 'FAILED'
      ? resolveDomainEntryError(null, understandingJobQuery.data?.error || 'failed')
      : null);

  const targetDomainName = establishedDomain?.domainName || domainInput.trim();

  const dialogContent = (
    <div
      role="dialog"
      aria-modal={isModal}
      aria-labelledby="domain-entry-title"
      className={`w-full max-w-[500px] bg-card/95 border border-border/80 rounded-2xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative space-y-6 ${className}`}
    >
      {/* Optional Dismiss Action for Modal / Additional Domains */}
      {isDismissable && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors focus-ring cursor-pointer"
        >
          <Icon icon={X} size="small" />
        </button>
      )}

      {/* 1. Loading State */}
      {isCreating || (activeJobId && (jobStatus === 'PENDING' || jobStatus === 'RUNNING')) ? (
        <div className="py-8 flex items-center justify-center">
          <LoadingState
            label={`Understanding ${targetDomainName}...`}
            description="Connecting to authoritative DNS, edge networks, and security endpoints"
          />
        </div>
      ) : currentErrorState ? (
        /* 2. Calm Human-Readable Product Error State (Nonexistent Domain UX Correction) */
        <div className="space-y-6 py-2" data-testid="domain-entry-error-card">
          <div className="space-y-2">
            <p className="text-[10.5px] font-semibold tracking-[0.24em] text-muted-foreground/75 uppercase font-mono">
              Nebula · Verification
            </p>
            <h3 className="font-display font-normal text-2xl text-foreground">
              {currentErrorState.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentErrorState.description}
            </p>
            {targetDomainName && (
              <p className="text-xs font-mono text-muted-foreground/70 pt-1">
                Domain: {targetDomainName}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleEditDomain}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-ring cursor-pointer"
            >
              Edit domain
            </button>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isCreating}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2.5 rounded-xl hover:opacity-90 active:opacity-75 transition-all shadow-[0_2px_8px_rgba(26,86,219,0.25)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer focus-ring"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        /* 3. Ready Domain Form */
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10.5px] font-semibold tracking-[0.24em] text-muted-foreground/75 uppercase">
              Nebula · Infrastructure Setup
            </p>

            <h2
              id="domain-entry-title"
              className="font-display font-normal text-2xl sm:text-[1.75rem] leading-[1.18] tracking-[-0.025em] text-foreground pr-6"
            >
              {isFirstDomain ? (
                <>
                  Add your first domain to understand your{' '}
                  <em className="italic font-normal text-foreground/80">infrastructure.</em>
                </>
              ) : (
                'Add a domain to your Workspace.'
              )}
            </h2>

            <p className="text-[0.9375rem] text-muted-foreground/90 leading-relaxed font-normal pt-1">
              Enter a domain Nebula can understand.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Icon
                icon={Globe}
                size="small"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
              />
              <input
                id="workspace-domain-input"
                type="text"
                value={domainInput}
                onChange={(e) => {
                  setDomainInput(e.target.value);
                  if (validationError) setValidationError(null);
                  if (entryError) setEntryError(null);
                }}
                placeholder="stripe.com, github.com"
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? 'domain-dialog-error' : undefined}
                disabled={isCreating}
                autoFocus
                className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-xl border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              />
            </div>

            {validationError && (
              <p id="domain-dialog-error" role="alert" className="text-xs text-severity-critical font-medium pl-1">
                {validationError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {isDismissable && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-ring cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!domainInput.trim() || isCreating}
                className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 sm:py-3 rounded-xl hover:opacity-90 active:opacity-75 transition-all shadow-[0_2px_8px_rgba(26,86,219,0.25)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer focus-ring shrink-0 flex items-center gap-1.5"
              >
                <span>Add domain</span>
                <Icon icon={ArrowRight} size="small" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        role="presentation"
        className="fixed inset-0 z-[1000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && isDismissable && onClose) {
            onClose();
          }
        }}
      >
        {dialogContent}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-14rem)] flex items-center justify-center p-4">
      {dialogContent}
    </div>
  );
};

DomainEntryDialog.displayName = 'DomainEntryDialog';
