import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  MonitorSmartphone,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Laptop,
  Globe,
  Trash2,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Stack, Cluster } from '../../../../components/layout';
import { authService } from '../../../../services/auth/auth.service';
import { validatePasswordChangeInput } from '../../contracts/password-management.contract';
import {
  formatDeviceSummary,
  formatSessionActivityTime,
  type UserSession,
} from '../../contracts/session-management.contract';
import type { User } from '../../../../types/auth.types';

export interface SecuritySettingsViewProps {
  readonly user: User | null;
}

/**
 * Authoritative Security, Password & Device Session Management Surface (AX-104, AX-105 & AX-111).
 *
 * Implements:
 * - Authenticated Password Change with validation and visibility toggles (Argon2)
 * - Active Sessions & Devices listing from backend truth
 * - Current session identification ("This device")
 * - Individual remote session revocation with server confirmation
 * - Global "Sign out all other sessions" with confirmation flow
 * - Simplified information architecture with Connected Accounts removed (AX-111)
 */
export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = () => {
  // --- Password Management State (AX-104) ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

  // --- Session Management State (AX-105) ---
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSuccessMessage, setSessionSuccessMessage] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);

  const isPasswordDirty =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  const handleResetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordFieldErrors({});
    setPasswordServerError(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFieldErrors({});
    setPasswordServerError(null);
    setPasswordSuccessMessage(null);

    const validation = validatePasswordChangeInput({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.isValid) {
      if (validation.fieldErrors) {
        setPasswordFieldErrors(validation.fieldErrors);
      }
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccessMessage(response.message || 'Password changed successfully.');
      handleResetPasswordForm();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update password. Please check your credentials and try again.';
      setPasswordServerError(message);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // --- Load Sessions (AX-105) ---
  const loadSessions = useCallback(async () => {
    try {
      const activeSessions = await authService.getSessions();
      setSessions(Array.isArray(activeSessions) ? activeSessions : []);
      setSessionError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to retrieve active sessions.';
      setSessionError(message);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authService
      .getSessions()
      .then((activeSessions) => {
        if (isMounted) {
          setSessions(Array.isArray(activeSessions) ? activeSessions : []);
          setSessionError(null);
          setIsLoadingSessions(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to retrieve active sessions.';
          setSessionError(message);
          setIsLoadingSessions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRevokeSession = async (session: UserSession) => {
    setRevokingSessionId(session.id);
    setSessionError(null);
    setSessionSuccessMessage(null);

    try {
      await authService.revokeSession(session.id);
      setSessionSuccessMessage(`Session on ${session.deviceName || 'device'} revoked.`);
      await loadSessions();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to revoke session.';
      setSessionError(message);
      // Auto-refresh to handle concurrent revocations safely
      await loadSessions();
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleLogoutAllOthers = async () => {
    setIsRevokingAll(true);
    setSessionError(null);
    setSessionSuccessMessage(null);

    try {
      await authService.logoutAll();
      setSessionSuccessMessage('All other active sessions have been signed out.');
      setShowLogoutAllConfirm(false);
      await loadSessions();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign out other sessions.';
      setSessionError(message);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];
  const otherSessions = sessions.filter((s) => s.id !== currentSession?.id);

  return (
    <Stack gap="lg" className="w-full">
      {/* 1. Password & Credentials Card (AX-104) */}
      <div className="rounded-xl border border-border-hairline bg-surface-elevated p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border-hairline flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Icon icon={KeyRound} size="default" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Password & Credentials</h2>
            <p className="text-xs text-muted-foreground">
              Manage your password and authentication security.
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-severity-success/10 text-severity-success border border-severity-success/20">
              <Icon icon={ShieldCheck} size="small" />
              <span>Argon2 Protected</span>
            </span>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4 border-t border-border-hairline">
          {passwordSuccessMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 p-3 rounded-lg bg-severity-success/10 border border-severity-success/20 text-severity-success text-xs font-medium"
            >
              <Icon icon={Check} size="small" />
              <span>{passwordSuccessMessage}</span>
            </div>
          )}

          {passwordServerError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
            >
              <Icon icon={AlertCircle} size="small" />
              <span>{passwordServerError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="settings-current-password"
              className="block text-xs font-medium text-foreground"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="settings-current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordFieldErrors.currentPassword) {
                    setPasswordFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                  }
                  if (passwordSuccessMessage) setPasswordSuccessMessage(null);
                }}
                disabled={isSubmittingPassword}
                placeholder="Enter current password"
                className={`w-full px-3 py-2 pr-10 rounded-lg border bg-background text-foreground text-xs focus-ring transition-all ${
                  passwordFieldErrors.currentPassword
                    ? 'border-destructive focus:border-destructive'
                    : 'border-border hover:border-border-strong'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus-ring p-1 rounded"
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                <Icon icon={showCurrentPassword ? EyeOff : Eye} size="small" />
              </button>
            </div>
            {passwordFieldErrors.currentPassword && (
              <p className="text-[11px] text-destructive font-medium">
                {passwordFieldErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="settings-new-password"
              className="block text-xs font-medium text-foreground"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="settings-new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordFieldErrors.newPassword) {
                    setPasswordFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                  if (passwordSuccessMessage) setPasswordSuccessMessage(null);
                }}
                disabled={isSubmittingPassword}
                placeholder="Enter new password (min. 8 characters)"
                className={`w-full px-3 py-2 pr-10 rounded-lg border bg-background text-foreground text-xs focus-ring transition-all ${
                  passwordFieldErrors.newPassword
                    ? 'border-destructive focus:border-destructive'
                    : 'border-border hover:border-border-strong'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus-ring p-1 rounded"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                <Icon icon={showNewPassword ? EyeOff : Eye} size="small" />
              </button>
            </div>
            {passwordFieldErrors.newPassword && (
              <p className="text-[11px] text-destructive font-medium">
                {passwordFieldErrors.newPassword}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="settings-confirm-password"
              className="block text-xs font-medium text-foreground"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="settings-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordFieldErrors.confirmPassword) {
                    setPasswordFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                  if (passwordSuccessMessage) setPasswordSuccessMessage(null);
                }}
                disabled={isSubmittingPassword}
                placeholder="Re-enter new password"
                className={`w-full px-3 py-2 pr-10 rounded-lg border bg-background text-foreground text-xs focus-ring transition-all ${
                  passwordFieldErrors.confirmPassword
                    ? 'border-destructive focus:border-destructive'
                    : 'border-border hover:border-border-strong'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus-ring p-1 rounded"
                aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
              >
                <Icon icon={showConfirmPassword ? EyeOff : Eye} size="small" />
              </button>
            </div>
            {passwordFieldErrors.confirmPassword && (
              <p className="text-[11px] text-destructive font-medium">
                {passwordFieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Cluster justify="end" align="center" gap="sm">
            {isPasswordDirty && (
              <button
                type="button"
                onClick={handleResetPasswordForm}
                disabled={isSubmittingPassword}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!isPasswordDirty || isSubmittingPassword}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer focus-ring shadow-sm"
            >
              {isSubmittingPassword ? (
                <>
                  <Icon icon={Loader2} size="small" className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </Cluster>
        </form>
      </div>

      {/* 2. Active Sessions & Device Management Card (AX-105) */}
      <div className="rounded-xl border border-border-hairline bg-surface-elevated p-6 space-y-6">
        <Cluster justify="between" align="center">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border-hairline flex items-center justify-center text-muted-foreground flex-shrink-0">
              <Icon icon={MonitorSmartphone} size="default" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">Active Sessions & Devices</h2>
              <p className="text-xs text-muted-foreground">
                Where your account is signed in across web and devices.
              </p>
            </div>
          </div>

          {otherSessions.length > 0 && !showLogoutAllConfirm && (
            <button
              type="button"
              onClick={() => setShowLogoutAllConfirm(true)}
              className="text-xs font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 transition-all cursor-pointer focus-ring"
            >
              Sign out all other sessions
            </button>
          )}
        </Cluster>

        {/* Global Sign Out Confirmation Box */}
        {showLogoutAllConfirm && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
            <div className="flex items-start gap-3">
              <Icon icon={AlertCircle} size="small" className="text-destructive mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-foreground">Sign out all other sessions?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This will immediately revoke access for all other browsers and devices. Your current session on this device will remain active.
                </p>
              </div>
            </div>
            <Cluster justify="end" align="center" gap="sm">
              <button
                type="button"
                onClick={() => setShowLogoutAllConfirm(false)}
                disabled={isRevokingAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutAllOthers}
                disabled={isRevokingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-all cursor-pointer focus-ring"
              >
                {isRevokingAll ? (
                  <>
                    <Icon icon={Loader2} size="small" className="animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <span>Confirm Sign Out</span>
                )}
              </button>
            </Cluster>
          </div>
        )}

        {/* Session Notifications */}
        {sessionSuccessMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 p-3 rounded-lg bg-severity-success/10 border border-severity-success/20 text-severity-success text-xs font-medium"
          >
            <Icon icon={Check} size="small" />
            <span>{sessionSuccessMessage}</span>
          </div>
        )}

        {sessionError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
          >
            <Icon icon={AlertCircle} size="small" />
            <span>{sessionError}</span>
          </div>
        )}

        {/* Sessions List Content */}
        {isLoadingSessions ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Icon icon={Loader2} size="small" className="animate-spin text-primary" />
            <span>Loading active sessions...</span>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Current Session Item */}
            {currentSession && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                  Current Session
                </h3>
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <Icon icon={Laptop} size="small" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <Cluster gap="xs" align="center">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {currentSession.deviceName || 'Current Device'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                          This device
                        </span>
                      </Cluster>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {formatDeviceSummary(currentSession)} · {currentSession.ipAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-severity-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-severity-success animate-pulse" />
                      <span>Active now</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Other Active Sessions */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Other Active Sessions
              </h3>

              {otherSessions.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border-hairline bg-card/50 text-center space-y-1">
                  <p className="text-xs font-medium text-foreground">You're not signed in anywhere else.</p>
                  <p className="text-[11px] text-muted-foreground">
                    Only your current browser session is actively authenticated with Nebula.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-hairline rounded-xl border border-border-hairline bg-card overflow-hidden">
                  {otherSessions.map((s) => {
                    const isRevokingThis = revokingSessionId === s.id;

                    return (
                      <div
                        key={s.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                            <Icon icon={Globe} size="small" />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-medium text-foreground truncate">
                              {s.deviceName || 'Remote Device'}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {formatDeviceSummary(s)} · {s.ipAddress} · {formatSessionActivityTime(s.lastActivityAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(s)}
                            disabled={isRevokingThis}
                            aria-label={`Revoke session on ${s.deviceName || 'remote device'}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 disabled:opacity-50 transition-all cursor-pointer focus-ring"
                          >
                            {isRevokingThis ? (
                              <>
                                <Icon icon={Loader2} size="small" className="animate-spin" />
                                <span>Revoking...</span>
                              </>
                            ) : (
                              <>
                                <Icon icon={Trash2} size="small" />
                                <span>Revoke</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Stack>
  );
};

SecuritySettingsView.displayName = 'SecuritySettingsView';
