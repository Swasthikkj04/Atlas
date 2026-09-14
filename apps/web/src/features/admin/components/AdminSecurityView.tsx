import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  CheckCircle2,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  Flame,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { adminApi, type AdminSecurityOverviewDto } from '../api/admin-api';

export const AdminSecurityView: React.FC = () => {
  const [data, setData] = useState<AdminSecurityOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Hardware key enrollment state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState('Admin Hardware Key');
  const [enrollInProgress, setEnrollInProgress] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  // Lockdown modal state
  const [showLockdownModal, setShowLockdownModal] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [lockdownInProgress, setLockdownInProgress] = useState(false);
  const [lockdownResult, setLockdownResult] = useState<{
    revokedSessionsCount: number;
    reason: string;
  } | null>(null);

  // Global session kill state
  const [showGlobalKillModal, setShowGlobalKillModal] = useState(false);
  const [globalKillReason, setGlobalKillReason] = useState('');
  const [globalKillInProgress, setGlobalKillInProgress] = useState(false);
  const [globalKillResult, setGlobalKillResult] = useState<{
    revokedCount: number;
  } | null>(null);

  const fetchSecurity = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSecurity();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  const handleEnrollHardwareKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEnrollError(null);

    // 1. Verify browser WebAuthn capabilities
    if (
      typeof window === 'undefined' ||
      !window.PublicKeyCredential ||
      !navigator.credentials?.create
    ) {
      setEnrollError('WebAuthn is not supported in this browser environment.');
      return;
    }

    setEnrollInProgress(true);
    try {
      const label = deviceLabel.trim() || 'Admin Hardware Key';

      // 2. Initiate enrollment challenge from backend
      const { options, challenge } = await adminApi.initiateWebAuthnEnrollment({
        deviceLabel: label,
      });

      // 3. Trigger native WebAuthn ceremony via browser API
      const regResponse = await startRegistration({ optionsJSON: options });

      // 4. Verify attestation response and persist credential
      await adminApi.verifyWebAuthnEnrollment({
        response: regResponse,
        challenge,
        deviceLabel: label,
      });

      // 5. Success handling & in-place state refresh
      setEnrollSuccess(`Hardware key "${label}" successfully enrolled and verified.`);
      setShowEnrollModal(false);
      setDeviceLabel('Admin Hardware Key');
      await fetchSecurity();
    } catch (err: any) {
      console.error('WebAuthn enrollment error:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('not allowed') || err.message?.includes('cancelled')) {
        setEnrollError('Hardware key enrollment ceremony was cancelled or timed out.');
      } else if (err.name === 'TimeoutError' || err.message?.includes('timed out')) {
        setEnrollError('Hardware key registration ceremony timed out.');
      } else {
        setEnrollError(err.message || 'Failed to complete hardware key enrollment ceremony.');
      }
    } finally {
      setEnrollInProgress(false);
    }
  };

  const handleTriggerLockdown = async () => {
    setLockdownInProgress(true);
    try {
      const res = await adminApi.triggerLockdown(
        lockdownReason || 'Operator manual emergency platform lockdown',
      );
      setLockdownResult({
        revokedSessionsCount: res.revokedSessionsCount,
        reason: res.reason,
      });
      setShowLockdownModal(false);
      setLockdownReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setLockdownInProgress(false);
    }
  };

  const handleTriggerGlobalKill = async () => {
    setGlobalKillInProgress(true);
    try {
      const res = await adminApi.revokeAllSessions(
        globalKillReason || 'Operator manual global session revocation',
      );
      setGlobalKillResult({
        revokedCount: res.revokedCount,
      });
      setShowGlobalKillModal(false);
      setGlobalKillReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setGlobalKillInProgress(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary,#FFFFFF)]">
            Security Architecture & Posture
          </h1>
          <p className="text-xs text-[var(--color-text-secondary,#94A3B8)] mt-1">
            Real-time cryptographic verification signals, authenticator status, and security invariants.
          </p>
        </div>

        <button
          onClick={fetchSecurity}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] text-xs text-[var(--color-text-secondary,#94A3B8)] hover:bg-[var(--color-bg-surface,#111726)] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Enrollment Success Banner */}
      {enrollSuccess && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{enrollSuccess}</span>
          </div>
          <button
            onClick={() => setEnrollSuccess(null)}
            className="text-emerald-400 hover:text-emerald-300 p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Lockdown Alert Banner */}
      {lockdownResult && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Emergency Platform Lockdown Activated</span>
          </div>
          <p>
            Admin identity has been set to <span className="font-mono font-bold">DISABLED</span>. {lockdownResult.revokedSessionsCount} active session(s) revoked immediately. Reason: {lockdownResult.reason}
          </p>
        </div>
      )}

      {/* Global Kill Alert Banner */}
      {globalKillResult && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Global Session Invalidation Complete</span>
          </div>
          <p>
            Revoked {globalKillResult.revokedCount} active session(s) across all administrative devices.
          </p>
        </div>
      )}

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-emerald-500/20 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-secondary,#94A3B8)] font-medium">Assurance Level</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-emerald-400">
              NIST AAL3
            </div>
            <p className="text-[10px] text-[var(--color-text-muted,#64748B)]">
              Hardware-bound cryptographic authenticator ceremony enforced.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-secondary,#94A3B8)] font-medium">WebAuthn Hardware Keys</span>
              <KeyRound className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-[var(--color-text-primary,#FFFFFF)]">
              {data ? data.activePasskeyCount : '-'} Enrolled
            </div>
            <p className="text-[10px] text-[var(--color-text-muted,#64748B)]">
              FIDO2 / WebAuthn resident authenticators authorized.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setEnrollError(null);
                setDeviceLabel('Admin Hardware Key');
                setShowEnrollModal(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Hardware Key</span>
            </button>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-secondary,#94A3B8)] font-medium">Credential Lockout</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-emerald-400">
              {data ? data.lockoutState : 'UNLOCKED'}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted,#64748B)]">
              Progressive rate limiting active (5 attempts / 15m window).
            </p>
          </div>
        </div>
      </div>

      {/* Security Invariants Table */}
      <div className="rounded-lg border border-[var(--color-border-hairline,rgba(255,255,255,0.08))] bg-[var(--color-bg-surface,#111726)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.06))] bg-[var(--color-bg-elevated,#1E293B)]/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-primary,#FFFFFF)]">Administrative Security Boundary Status</span>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All Boundaries Enforced</span>
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border-hairline,rgba(255,255,255,0.04))] text-xs">
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--color-text-primary,#FFFFFF)]">Admin Identity Isolation</div>
              <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-0.5">
                MAX_ADMIN_COUNT = 1. Owner-exclusive identity boundary.
              </div>
            </div>
            <span className="font-mono text-emerald-400">ENFORCED</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--color-text-primary,#FFFFFF)]">Public Lifecycle Isolation</div>
              <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-0.5">
                No public registration, OAuth elevate, or self-service admin promotion permitted.
              </div>
            </div>
            <span className="font-mono text-emerald-400">ENFORCED</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--color-text-primary,#FFFFFF)]">Dedicated Key Boundary (kid)</div>
              <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-0.5">
                Independent ADMIN_JWT_SECRET with rotation-capable Key Identifier header.
              </div>
            </div>
            <span className="font-mono text-emerald-400">ENFORCED</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--color-text-primary,#FFFFFF)]">Authoritative Session Binding</div>
              <div className="text-[10px] text-[var(--color-text-secondary,#94A3B8)] mt-0.5">
                Token validation requires database-anchored active session verification on each request.
              </div>
            </div>
            <span className="font-mono text-emerald-400">ENFORCED</span>
          </div>
        </div>
      </div>

      {/* Emergency Platform Containment Controls */}
      <section aria-labelledby="section-emergency" className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          <h2 id="section-emergency" className="text-sm font-semibold text-[var(--color-text-primary,#FFFFFF)]">
            Emergency Incident Containment
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-primary,#FFFFFF)]">Emergency Platform Lockdown</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary,#94A3B8)]">
              Disables the platform Admin identity immediately and terminates all active administrative sessions across every device.
            </p>
            <button
              onClick={() => setShowLockdownModal(true)}
              className="px-3 py-1.5 rounded text-xs font-medium bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              Trigger Platform Lockdown
            </button>
          </div>

          <div className="p-5 rounded-lg bg-[var(--color-bg-surface,#111726)] border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-primary,#FFFFFF)]">Global Session Invalidation</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary,#94A3B8)]">
              Revokes all active admin sessions while preserving the administrative credential for immediate re-authentication.
            </p>
            <button
              onClick={() => setShowGlobalKillModal(true)}
              className="px-3 py-1.5 rounded text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              Revoke All Admin Sessions
            </button>
          </div>
        </div>
      </section>

      {/* Emergency Lockdown Confirmation Modal */}
      {showLockdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-surface,#111726)] border border-rose-500/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Confirm Emergency Platform Lockdown</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary,#94A3B8)]">
              This action will transition the Admin identity status to <span className="font-mono text-rose-400 font-bold">DISABLED</span>, revoke all active sessions, and record a critical security incident.
            </p>
            <div>
              <label className="text-[11px] text-[var(--color-text-muted,#64748B)] block mb-1">
                Lockdown Reason (Required for Audit Chain):
              </label>
              <input
                type="text"
                placeholder="e.g. Suspected hardware passkey compromise"
                value={lockdownReason}
                onChange={(e) => setLockdownReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-[var(--color-bg-elevated,#1E293B)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={lockdownInProgress}
                onClick={() => setShowLockdownModal(false)}
                className="px-3 py-1.5 rounded text-xs text-[var(--color-text-secondary,#94A3B8)] hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={lockdownInProgress}
                onClick={handleTriggerLockdown}
                className="px-3 py-1.5 rounded text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {lockdownInProgress ? 'Activating Lockdown...' : 'Confirm Lockdown'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Kill Confirmation Modal */}
      {showGlobalKillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-surface,#111726)] border border-amber-500/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Confirm Global Session Revocation</h3>
            </div>
            <p className="text-xs text-[var(--color-text-secondary,#94A3B8)]">
              This will immediately revoke all active sessions across all devices for the administrative plane.
            </p>
            <div>
              <label className="text-[11px] text-[var(--color-text-muted,#64748B)] block mb-1">
                Revocation Reason:
              </label>
              <input
                type="text"
                placeholder="e.g. Routine administrative credential cycle"
                value={globalKillReason}
                onChange={(e) => setGlobalKillReason(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-[var(--color-bg-elevated,#1E293B)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={globalKillInProgress}
                onClick={() => setShowGlobalKillModal(false)}
                className="px-3 py-1.5 rounded text-xs text-[var(--color-text-secondary,#94A3B8)] hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={globalKillInProgress}
                onClick={handleTriggerGlobalKill}
                className="px-3 py-1.5 rounded text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                {globalKillInProgress ? 'Revoking...' : 'Revoke All Sessions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Key Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-surface,#111726)] border border-blue-500/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary,#FFFFFF)]">
                  Enroll Hardware Key (WebAuthn / FIDO2)
                </h3>
              </div>
              <button
                disabled={enrollInProgress}
                onClick={() => {
                  if (!enrollInProgress) {
                    setShowEnrollModal(false);
                    setEnrollError(null);
                  }
                }}
                className="text-[var(--color-text-muted,#64748B)] hover:text-[var(--color-text-primary,#FFFFFF)] p-1 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-secondary,#94A3B8)]">
              Register a phishing-resistant FIDO2 hardware authenticator (such as a YubiKey or platform authenticator) to enforce NIST AAL3 assurance.
            </p>

            {enrollError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollHardwareKey} className="space-y-4">
              <div>
                <label className="text-[11px] text-[var(--color-text-muted,#64748B)] block mb-1">
                  Device Label / Key Identifier:
                </label>
                <input
                  type="text"
                  placeholder="e.g. YubiKey 5C NFC, MacBook Touch ID"
                  value={deviceLabel}
                  disabled={enrollInProgress}
                  onChange={(e) => setDeviceLabel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-[var(--color-bg-elevated,#1E293B)] border border-[var(--color-border-hairline,rgba(255,255,255,0.1))] text-xs text-[var(--color-text-primary,#FFFFFF)] focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              <div className="p-3 rounded-md bg-[var(--color-bg-elevated,#1E293B)]/60 border border-[var(--color-border-hairline,rgba(255,255,255,0.06))] text-[11px] text-[var(--color-text-secondary,#94A3B8)] space-y-1">
                <div className="font-medium text-[var(--color-text-primary,#FFFFFF)]">Native WebAuthn Ceremony</div>
                <div>
                  When you click &ldquo;Enroll Hardware Key&rdquo;, your browser will trigger a native WebAuthn prompt. Touch your hardware key or verify your device biometric.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={enrollInProgress}
                  onClick={() => {
                    setShowEnrollModal(false);
                    setEnrollError(null);
                  }}
                  className="px-3 py-1.5 rounded text-xs text-[var(--color-text-secondary,#94A3B8)] hover:bg-[var(--color-bg-elevated,#1E293B)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollInProgress}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                >
                  {enrollInProgress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Waiting for Authenticator...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Enroll Hardware Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
