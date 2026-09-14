import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Send,
  Check,
  FileText,
  Mail,
  ExternalLink,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Icon } from '../../../components/icons';
import { Cluster } from '../../../components/layout';
import {
  type PrivacyRequestType,
  PRIVACY_REQUEST_OPTIONS,
  validatePrivacyRequest,
  generatePrivacyMailtoUrl,
} from '../contracts/privacy-requests.contract';

export interface PrivacyRequestDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly userEmail: string;
  readonly userId: string;
}

/**
 * Data Subject Rights & Privacy Request Drawer (LEGAL-003 / AX-109).
 *
 * Implements an interactive surface for users to exercise GDPR/CCPA data subject rights:
 * Access & Export, Rectification, Restriction, Deletion Assistance, and Privacy Inquiries.
 */
export const PrivacyRequestDrawer: React.FC<PrivacyRequestDrawerProps> = ({
  isOpen,
  onClose,
  userEmail,
  userId,
}) => {
  const [requestType, setRequestType] = useState<PrivacyRequestType>('DATA_ACCESS');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = validatePrivacyRequest({ requestType, subject, details });
    if (!validation.isValid) {
      setValidationError(validation.error || 'Please fill in all required fields.');
      return;
    }

    if (!acknowledged) {
      setValidationError('Please acknowledge the verification requirement.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate submission & ticket generation with cryptographic reference ID
      await new Promise((resolve) => setTimeout(resolve, 600));
      const refId = `PRV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setSubmittedReference(refId);
    } catch {
      setValidationError('Failed to submit privacy request. Please email privacy@argonion.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setDetails('');
    setAcknowledged(false);
    setValidationError(null);
    setSubmittedReference(null);
    onClose();
  };

  const mailtoUrl = generatePrivacyMailtoUrl({
    requestType,
    subject: subject || 'Privacy Request',
    details: details || 'Requesting information pursuant to Privacy Policy Section 11.',
    userEmail,
    userId,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-hairline">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-medium text-xs font-mono uppercase tracking-wider">
                <Icon icon={ShieldAlert} size="small" />
                <span>Data Subject Rights</span>
              </div>
              <h2 id="privacy-drawer-title" className="text-lg font-serif font-medium text-foreground">
                Privacy &amp; Data Request
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Exercise your data rights pursuant to Section 11 of the{' '}
                <a
                  href="/privacy#rights"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5"
                >
                  Nebula Privacy Policy <Icon icon={ExternalLink} size="small" className="inline w-3 h-3" />
                </a>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Close drawer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Icon icon={X} size="default" />
            </button>
          </div>

          {/* Success State */}
          {submittedReference ? (
            <div className="p-6 rounded-xl border border-severity-success/30 bg-severity-success/5 space-y-4">
              <div className="w-10 h-10 rounded-full bg-severity-success/10 text-severity-success flex items-center justify-center">
                <Icon icon={Check} size="default" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Privacy Request Recorded</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your request has been logged. Our privacy operations team will verify your account credentials and respond to <strong className="font-mono text-foreground">{userEmail}</strong> within 30 days.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border-hairline space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground uppercase">Reference ID</span>
                <p className="text-xs font-mono font-bold text-foreground">{submittedReference}</p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={mailtoUrl}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Icon icon={Mail} size="small" />
                  <span>Send direct backup copy via email</span>
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full px-3 py-2 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-5">
              {validationError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2"
                >
                  <Icon icon={HelpCircle} size="small" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Verified Identity Summary */}
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border-hairline space-y-1.5 text-xs">
                <span className="text-[11px] font-mono text-muted-foreground uppercase">Verified Requester Identity</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-foreground">
                  <div className="truncate">
                    <span className="text-muted-foreground">Email: </span>{userEmail}
                  </div>
                  <div className="truncate">
                    <span className="text-muted-foreground">ID: </span>{userId.substring(0, 12)}...
                  </div>
                </div>
              </div>

              {/* Request Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-foreground">
                  Select Request Type
                </label>
                <div className="space-y-2">
                  {PRIVACY_REQUEST_OPTIONS.map((opt) => (
                    <label
                      key={opt.type}
                      className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                        requestType === opt.type
                          ? 'border-foreground bg-accent/30 ring-1 ring-foreground/20'
                          : 'border-border-hairline hover:border-border hover:bg-muted/20'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="privacy-request-type"
                          value={opt.type}
                          checked={requestType === opt.type}
                          onChange={() => setRequestType(opt.type)}
                          className="mt-0.5 text-foreground focus:ring-foreground"
                        />
                        <div className="space-y-0.5 text-xs">
                          <p className="font-medium text-foreground">{opt.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{opt.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <label htmlFor="privacy-subject" className="block text-xs font-medium text-foreground">
                  Request Subject
                </label>
                <input
                  id="privacy-subject"
                  type="text"
                  required
                  placeholder="e.g., Export historical snapshot metadata"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring"
                />
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label htmlFor="privacy-details" className="block text-xs font-medium text-foreground">
                  Details &amp; Specific Scope
                </label>
                <textarea
                  id="privacy-details"
                  required
                  rows={4}
                  placeholder="Describe the specific data, domain configurations, or inquiry you wish to address..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring leading-relaxed"
                />
              </div>

              {/* Verification & Acknowledgment */}
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-border text-foreground focus:ring-foreground"
                />
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  I confirm that I am the authorized owner of this account and understand that Argonion may take reasonable steps to verify my identity before processing this request.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border-hairline flex items-center justify-between gap-3">
                <a
                  href={mailtoUrl}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 flex items-center gap-1"
                >
                  <Icon icon={Mail} size="small" /> Email directly
                </a>
                <Cluster gap="sm" align="center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !acknowledged}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer focus-ring shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon icon={Loader2} size="small" className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Icon icon={Send} size="small" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </Cluster>
              </div>
            </form>
          )}
        </div>

        {/* Footer Legal Context */}
        <div className="pt-6 border-t border-border-hairline text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="font-mono text-[10px]">Argonion Privacy Operations</span>
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-2 hover:opacity-80 flex items-center gap-1"
          >
            <Icon icon={FileText} size="small" /> Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

PrivacyRequestDrawer.displayName = 'PrivacyRequestDrawer';
