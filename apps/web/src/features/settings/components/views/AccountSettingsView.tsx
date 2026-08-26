import React, { useState, useEffect, useCallback } from 'react';
import {
  User as UserIcon,
  UserRound,
  UserRoundCog,
  Mail,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  PowerOff,
  Lock,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Stack, Cluster } from '../../../../components/layout';
import { useAuth } from '../../../auth/hooks/useAuth';
import { accountService } from '../../../../services/account/account.service';
import { validateProfileFullName } from '../../contracts/profile-management.contract';
import {
  type AccountOverview,
  formatAccountStatus,
  isLifecycleDestructiveActionAllowed,
} from '../../contracts/account-lifecycle.contract';
import type { User } from '../../../../types/auth.types';

export interface AccountSettingsViewProps {
  readonly user: User | null;
}

/**
 * Authoritative Account & Profile Management Surface (AX-103 / AX-108).
 *
 * Implements:
 * - Real profile identity editing (Full Name)
 * - Authoritative Account Lifecycle Status (Active / Deactivated)
 * - Secure Account Deactivation with Session Termination
 * - Irreversible Permanent Account Deletion with Re-Authentication Gate
 */
export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ user }) => {
  const { updateProfile, logout } = useAuth();

  const [prevFullName, setPrevFullName] = useState(user?.fullName);
  const [fullNameInput, setFullNameInput] = useState(user?.fullName || '');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileValidationError, setProfileValidationError] = useState<string | null>(null);
  const [profileServerError, setProfileServerError] = useState<string | null>(null);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);

  // Account Overview & Lifecycle State
  const [accountOverview, setAccountOverview] = useState<AccountOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // Deactivation Flow State
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Deletion Flow State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [lifecycleSuccessMessage, setLifecycleSuccessMessage] = useState<string | null>(null);

  if (prevFullName !== user?.fullName) {
    setPrevFullName(user?.fullName);
    setFullNameInput(user?.fullName || '');
  }

  const loadOverview = useCallback(async () => {
    try {
      const overview = await accountService.getAccountOverview();
      setAccountOverview(overview);
    } catch {
      // Graceful fallback to user state if overview endpoint not reached
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    accountService
      .getAccountOverview()
      .then((res) => {
        if (isMounted) {
          setAccountOverview(res);
          setIsLoadingOverview(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingOverview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isDirty = fullNameInput.trim() !== (user?.fullName || '').trim();
  const displayName =
    accountOverview?.fullName || user?.fullName || user?.email?.split('@')[0] || 'Authenticated User';

  const accountStatus = formatAccountStatus(accountOverview?.status || 'ACTIVE');
  const hasPassword = accountOverview?.hasPassword ?? true;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileValidationError(null);
    setProfileServerError(null);
    setProfileSuccessMessage(null);

    const validation = validateProfileFullName(fullNameInput);
    if (!validation.isValid || !validation.sanitizedFullName) {
      setProfileValidationError(validation.error || 'Invalid name provided.');
      return;
    }

    setIsSubmittingProfile(true);
    try {
      await updateProfile({ fullName: validation.sanitizedFullName });
      setProfileSuccessMessage('Profile updated successfully.');
      setFullNameInput(validation.sanitizedFullName);
      await loadOverview();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update profile. Please try again.';
      setProfileServerError(message);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeactivateError(null);
    setIsDeactivating(true);

    try {
      const res = await accountService.deactivateAccount({
        currentPassword: hasPassword ? deactivatePassword : undefined,
        confirmText: !hasPassword ? deactivateConfirmText : undefined,
      });

      setLifecycleSuccessMessage(res.message);
      setShowDeactivateModal(false);

      // Graceful termination logout
      setTimeout(async () => {
        await logout();
        window.location.assign('/login');
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to deactivate account. Please check your credentials.';
      setDeactivateError(message);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const res = await accountService.deleteAccount({
        currentPassword: hasPassword ? deletePassword : undefined,
        confirmText: deleteConfirmText,
      });

      setLifecycleSuccessMessage(res.message);
      setShowDeleteModal(false);

      // Graceful termination logout
      setTimeout(async () => {
        await logout();
        window.location.assign('/login');
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to delete account. Please check your password and confirmation.';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Stack gap="lg" className="w-full">
      {/* Global Lifecycle Feedback Banner */}
      {lifecycleSuccessMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 p-4 rounded-xl bg-severity-success/10 border border-severity-success/20 text-severity-success text-xs font-medium"
        >
          <Icon icon={Check} size="small" />
          <span>{lifecycleSuccessMessage} Redirecting to login...</span>
        </div>
      )}

      {/* 1. Identity Summary Card */}
      <div className="rounded-xl border border-border-hairline bg-surface-elevated p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border-hairline flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Icon icon={UserRound} size="default" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground truncate">{displayName}</h2>
            <p className="text-xs font-mono text-muted-foreground truncate">{user?.email || '—'}</p>
          </div>
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                accountStatus.tone === 'success'
                  ? 'bg-severity-success/10 text-severity-success border-severity-success/20'
                  : 'bg-severity-warning/10 text-severity-warning border-severity-warning/20'
              }`}
            >
              <Icon icon={ShieldCheck} size="small" />
              <span>{accountStatus.label}</span>
            </span>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4 pt-4 border-t border-border-hairline">
          {profileSuccessMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 p-3 rounded-lg bg-severity-success/10 border border-severity-success/20 text-severity-success text-xs font-medium"
            >
              <Icon icon={Check} size="small" />
              <span>{profileSuccessMessage}</span>
            </div>
          )}

          {profileServerError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
            >
              <Icon icon={AlertCircle} size="small" />
              <span>{profileServerError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="settings-full-name"
              className="block text-xs font-medium text-foreground"
            >
              Full Name
            </label>
            <div className="relative">
              <input
                id="settings-full-name"
                type="text"
                value={fullNameInput}
                onChange={(e) => {
                  setFullNameInput(e.target.value);
                  if (profileValidationError) setProfileValidationError(null);
                  if (profileSuccessMessage) setProfileSuccessMessage(null);
                }}
                disabled={isSubmittingProfile}
                placeholder="Enter your full name"
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-xs focus-ring transition-all ${
                  profileValidationError
                    ? 'border-destructive focus:border-destructive'
                    : 'border-border hover:border-border-strong'
                }`}
              />
            </div>
            {profileValidationError && (
              <p className="text-[11px] text-destructive font-medium">{profileValidationError}</p>
            )}
          </div>

          <Cluster justify="end" align="center" gap="sm">
            {isDirty && (
              <button
                type="button"
                onClick={() => {
                  setFullNameInput(user?.fullName || '');
                  setProfileValidationError(null);
                  setProfileServerError(null);
                }}
                disabled={isSubmittingProfile}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!isDirty || isSubmittingProfile}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer focus-ring shadow-sm"
            >
              {isSubmittingProfile ? (
                <>
                  <Icon icon={Loader2} size="small" className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </Cluster>
        </form>

        {/* Read-Only Account Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-hairline text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px]">
              <Icon icon={Mail} size="small" /> Email Address
            </span>
            <p className="font-medium text-foreground font-mono">{user?.email || '—'}</p>
            <p className="text-[11px] text-muted-foreground">
              Primary email used for sign-in and security notifications.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px]">
              <Icon icon={UserIcon} size="small" /> User ID
            </span>
            <p className="font-mono text-muted-foreground text-[11px] truncate">
              {user?.id || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Account Lifecycle & Data Management Card (AX-108) */}
      <div className="rounded-xl border border-border-hairline bg-surface-elevated p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border-hairline flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Icon icon={UserRoundCog} size="default" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">Account Lifecycle</h2>
            <p className="text-xs text-muted-foreground">
              Manage your account active state, temporary deactivation, or permanent deletion.
            </p>
          </div>
        </div>

        {isLoadingOverview ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Icon icon={Loader2} size="small" className="animate-spin text-primary" />
            <span>Loading account security status...</span>
          </div>
        ) : (
          <div className="divide-y divide-border-hairline rounded-xl border border-border-hairline bg-card overflow-hidden">
            {/* Deactivation Row */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <Cluster gap="xs" align="center">
                  <Icon icon={PowerOff} size="small" className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-foreground">Deactivate Account</h3>
                </Cluster>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Temporarily disable your account and sign out all active sessions across your devices.
                  Your historical infrastructure snapshots and monitoring configurations remain securely preserved.
                </p>
              </div>
              <div className="flex items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeactivateModal(true);
                    setShowDeleteModal(false);
                    setDeactivateError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border-hairline hover:border-border-strong bg-background text-foreground text-xs font-medium transition-all cursor-pointer focus-ring"
                >
                  Deactivate
                </button>
              </div>
            </div>

            {/* Deletion Row */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <Cluster gap="xs" align="center">
                  <Icon icon={Trash2} size="small" className="text-destructive" />
                  <h3 className="text-xs font-semibold text-destructive">Delete Account Permanently</h3>
                </Cluster>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Permanently delete your Nebula account, terminate all sessions, and remove your identity.
                  This action is irreversible and cannot be undone.
                </p>
              </div>
              <div className="flex items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowDeactivateModal(false);
                    setDeleteError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 text-xs font-medium transition-all cursor-pointer focus-ring"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivation Confirmation Modal */}
        {showDeactivateModal && (
          <div className="p-5 rounded-xl border border-border-hairline bg-muted/30 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <Icon icon={PowerOff} size="small" className="text-primary mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-foreground">
                  Confirm Account Deactivation
                </h3>
                <p className="text-xs text-muted-foreground">
                  All active sessions will be terminated. You will need to contact support or log in to reactivate.
                </p>
              </div>
            </div>

            {deactivateError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
              >
                <Icon icon={AlertCircle} size="small" />
                <span>{deactivateError}</span>
              </div>
            )}

            <form onSubmit={handleDeactivate} className="space-y-3">
              {hasPassword ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="deactivate-password"
                    className="block text-xs font-medium text-foreground flex items-center gap-1"
                  >
                    <Icon icon={Lock} size="small" className="text-muted-foreground" />
                    <span>Enter Current Password to Confirm</span>
                  </label>
                  <input
                    id="deactivate-password"
                    type="password"
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                    required
                    disabled={isDeactivating}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label
                    htmlFor="deactivate-confirm-text"
                    className="block text-xs font-medium text-foreground"
                  >
                    Type <code className="font-mono bg-muted px-1 rounded">DEACTIVATE</code> to confirm
                  </label>
                  <input
                    id="deactivate-confirm-text"
                    type="text"
                    value={deactivateConfirmText}
                    onChange={(e) => setDeactivateConfirmText(e.target.value)}
                    required
                    disabled={isDeactivating}
                    placeholder="Type DEACTIVATE"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring"
                  />
                </div>
              )}

              <Cluster justify="end" align="center" gap="sm">
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(false)}
                  disabled={isDeactivating}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeactivating ||
                    (hasPassword && !deactivatePassword) ||
                    (!hasPassword && deactivateConfirmText.trim().toUpperCase() !== 'DEACTIVATE')
                  }
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer focus-ring"
                >
                  {isDeactivating ? (
                    <>
                      <Icon icon={Loader2} size="small" className="animate-spin" />
                      <span>Deactivating...</span>
                    </>
                  ) : (
                    <span>Confirm Deactivation</span>
                  )}
                </button>
              </Cluster>
            </form>
          </div>
        )}

        {/* Deletion Confirmation Modal */}
        {showDeleteModal && (
          <div className="p-5 rounded-xl border border-destructive/40 bg-destructive/5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <Icon icon={AlertTriangle} size="small" className="text-destructive mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-destructive">
                  Permanent Account Deletion Warning
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This action permanently deletes your Nebula account, external provider links, and access credentials.
                  This action is irreversible.
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
              >
                <Icon icon={AlertCircle} size="small" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDelete} className="space-y-3">
              {hasPassword && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="delete-password"
                    className="block text-xs font-medium text-foreground flex items-center gap-1"
                  >
                    <Icon icon={Lock} size="small" className="text-muted-foreground" />
                    <span>Enter Current Password</span>
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    disabled={isDeleting}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus-ring"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="delete-confirm-text"
                  className="block text-xs font-medium text-foreground"
                >
                  Type <code className="font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">DELETE</code> to confirm
                </label>
                <input
                  id="delete-confirm-text"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  required
                  disabled={isDeleting}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 rounded-lg border border-destructive/30 bg-background text-foreground text-xs focus-ring"
                />
              </div>

              <Cluster justify="end" align="center" gap="sm">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeleting ||
                    !isLifecycleDestructiveActionAllowed(
                      hasPassword,
                      deletePassword,
                      deleteConfirmText,
                      'DELETE',
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer focus-ring"
                >
                  {isDeleting ? (
                    <>
                      <Icon icon={Loader2} size="small" className="animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <span>Permanently Delete Account</span>
                  )}
                </button>
              </Cluster>
            </form>
          </div>
        )}
      </div>
    </Stack>
  );
};

AccountSettingsView.displayName = 'AccountSettingsView';
