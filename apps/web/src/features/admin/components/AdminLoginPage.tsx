import React, { useState, useEffect } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { Shield, Key, Lock, AlertCircle, CheckCircle2, RefreshCw, Cpu } from 'lucide-react';
import { adminApi } from '../api/admin-api';

interface AdminLoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('platform-owner');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [authStatus, setAuthStatus] = useState<{
    isProvisioned: boolean;
    isActive?: boolean;
    hasPasskeys: boolean;
    identifier?: string | null;
  } | null>(null);

  const [mode, setMode] = useState<'LOGIN' | 'ENROLL'>('LOGIN');
  const [primaryPassword, setPrimaryPassword] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('Owner Hardware Key');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setCheckingStatus(true);
      setError(null);
      const status = await adminApi.getAuthStatus();
      setAuthStatus(status);
      if (status.identifier) {
        setIdentifier(status.identifier);
      }
      if (status.isProvisioned && !status.hasPasskeys) {
        setMode('ENROLL');
      }
    } catch (err: any) {
      console.error('Failed to load admin auth status:', err);
      setError('Unable to connect to Admin authentication gateway.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleWebAuthnLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please provide an Admin identifier.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      // Step 1: Request WebAuthn challenge & options
      const { options } = await adminApi.initiateWebAuthnAuth(identifier.trim());

      // Step 2: Invoke browser WebAuthn API (TouchID, Windows Hello, YubiKey)
      const assertionResponse = await startAuthentication({ optionsJSON: options });

      // Step 3: Verify assertion on backend & receive short-lived Admin JWT
      const result = await adminApi.verifyWebAuthnAuth(
        identifier.trim(),
        assertionResponse,
        options.challenge,
      );

      // Step 4: Securely store short-lived token in sessionStorage
      sessionStorage.setItem('admin_access_token', result.accessToken);

      setSuccessMsg('Authentication verified. Entering Admin Console...');
      setTimeout(() => {
        onLoginSuccess(result.accessToken);
      }, 500);
    } catch (err: any) {
      console.error('WebAuthn login error:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Passkey prompt was cancelled or timed out.');
      } else {
        setError(err?.message || 'WebAuthn authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryPassword) {
      setError('Primary Admin password is required to enroll a Passkey.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      // Step 1: Initiate WebAuthn enrollment with primary password proof
      const { options } = await adminApi.initiateWebAuthnEnrollment({
        identifier: identifier.trim(),
        password: primaryPassword,
        deviceLabel: deviceLabel.trim() || 'Owner Key',
      });

      // Step 2: Invoke browser WebAuthn registration ceremony
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // Step 3: Verify registration on backend
      await adminApi.verifyWebAuthnEnrollment({
        identifier: identifier.trim(),
        response: registrationResponse,
        challenge: options.challenge,
        deviceLabel: deviceLabel.trim() || 'Owner Key',
      });

      setSuccessMsg('Passkey successfully enrolled! Authenticating now...');

      // Step 4: Immediately authenticate with newly enrolled passkey
      await handleWebAuthnLogin();
    } catch (err: any) {
      console.error('Passkey enrollment error:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Passkey registration was cancelled or timed out.');
      } else {
        setError(err?.message || 'Passkey enrollment failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-cyan-950/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-8 backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Nebula Admin Console
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
            <Cpu className="h-3 w-3" />
            <span>AAL3 High Assurance Boundary</span>
          </div>
        </div>

        {/* Loading status indicator */}
        {checkingStatus && (
          <div className="py-8 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
            <span className="text-sm">Verifying gateway status...</span>
          </div>
        )}

        {/* Not Provisioned Warning */}
        {!checkingStatus && authStatus && !authStatus.isProvisioned && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-sm flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-200">Admin Identity Not Provisioned</p>
                <p className="mt-1 text-xs text-amber-300/80">
                  No Admin identity has been initialized for this platform. Run the controlled CLI provision command:
                </p>
                <div className="mt-2 bg-black/50 p-2 rounded text-xs font-mono text-zinc-300 border border-amber-900/40">
                  pnpm --filter api run provision:admin
                </div>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Gateway Status
            </button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex gap-2.5 items-start">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-sm flex gap-2.5 items-start">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="text-xs">{successMsg}</span>
          </div>
        )}

        {/* Standard WebAuthn Passkey Login Mode */}
        {!checkingStatus && authStatus?.isProvisioned && mode === 'LOGIN' && (
          <form onSubmit={handleWebAuthnLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Admin Identifier
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="platform-owner"
                required
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              <span>{loading ? 'Authenticating...' : 'Sign in with Passkey / WebAuthn'}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setMode('ENROLL')}
                className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Enroll New Hardware Key or Passkey &rarr;
              </button>
            </div>
          </form>
        )}

        {/* Initial Passkey Enrollment Mode */}
        {!checkingStatus && authStatus?.isProvisioned && mode === 'ENROLL' && (
          <form onSubmit={handlePasskeyEnrollment} className="space-y-4">
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg text-xs text-cyan-300">
              Passkey enrollment requires verification of the primary Admin password credential.
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Admin Identifier
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Primary Admin Password
              </label>
              <input
                type="password"
                value={primaryPassword}
                onChange={(e) => setPrimaryPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Key / Device Label
              </label>
              <input
                type="text"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
                placeholder="YubiKey 5C / Touch ID"
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>{loading ? 'Registering...' : 'Register Passkey & Authenticate'}</span>
            </button>

            {authStatus.hasPasskeys && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  &larr; Return to Passkey Sign In
                </button>
              </div>
            )}
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-[#30363d] text-center space-y-2">
          <div className="text-[11px] text-zinc-400 uppercase tracking-widest font-mono">
            Zero OAuth • Zero Public Provisioning • Immutable Audit
          </div>
          <div className="text-[10px] text-zinc-400">
            Protected by dedicated administrative security boundary.
          </div>
        </div>
      </div>
    </div>
  );
};
