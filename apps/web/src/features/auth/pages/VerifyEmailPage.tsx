import React, { useState, useEffect, type FormEvent } from 'react';
import {
  Check,
  ArrowRight,
  Loader2,
  Mail,
  Send,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../../../services/auth';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import {
  UnderstandingContextCard,
  type GuestUnderstandingContext,
} from '../components/UnderstandingContextCard';
import { getGreetingName } from '../utils/name.util';
import { maskEmail } from '../utils/email.util';

export type VerificationState =
  | 'verifying'
  | 'success'
  | 'already_verified'
  | 'expired'
  | 'invalid'
  | 'idle';

export const VerifyEmailPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated, verifyEmail, checkAndClaimGuestSession } =
    useAuth();

  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [status, setStatus] = useState<VerificationState>(
    token ? 'verifying' : 'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>(
    'idle',
  );
  const [resendCooldown, setResendCooldown] = useState(0);
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Context if guest session was active
  const [context] = useState<GuestUnderstandingContext | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('nebula_guest_claim');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.domain) {
            return {
              domain: parsed.domain,
              understandingType: 'Infrastructure Understanding',
              expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
            };
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function executeVerification() {
      try {
        const response = await verifyEmail(token);
        if (!isMounted) return;

        if (response?.alreadyVerified) {
          setStatus('already_verified');
          return;
        }

        setStatus('success');

        // Claim guest session if present
        try {
          const claimResult = await checkAndClaimGuestSession();
          if (claimResult?.domainName && isMounted) {
            setClaimedDomain(claimResult.domainName);
          }
        } catch (claimErr: unknown) {
          const msg =
            claimErr instanceof Error
              ? claimErr.message
              : 'Sorry, your domain limit has been reached.';
          if (isMounted) {
            setClaimError(msg);
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('nebula_claim_error', msg);
          }
        }

        const timer = setTimeout(() => {
          if (isMounted) {
            window.location.href = '/workspace';
          }
        }, 1800);

        return () => clearTimeout(timer);
      } catch (err: unknown) {
        if (!isMounted) return;

        const msg =
          err instanceof Error
            ? err.message
            : 'Verification link is invalid or has expired.';

        setErrorMessage(msg);

        if (
          msg.toLowerCase().includes('expired') ||
          msg.toLowerCase().includes('24 hours')
        ) {
          setStatus('expired');
        } else if (msg.toLowerCase().includes('already verified')) {
          setStatus('already_verified');
        } else {
          setStatus('invalid');
        }
      }
    }

    void executeVerification();

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail, checkAndClaimGuestSession]);

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken) return;

    setStatus('verifying');
    setErrorMessage(null);

    try {
      const response = await verifyEmail(cleanToken);

      if (response?.alreadyVerified) {
        setStatus('already_verified');
        return;
      }

      setStatus('success');

      try {
        const claimResult = await checkAndClaimGuestSession();
        if (claimResult?.domainName) {
          setClaimedDomain(claimResult.domainName);
        }
      } catch {
        // non-blocking
      }

      setTimeout(() => {
        window.location.href = '/workspace';
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Verification link is invalid or has expired.';

      setErrorMessage(msg);

      if (msg.toLowerCase().includes('expired')) {
        setStatus('expired');
      } else if (msg.toLowerCase().includes('already verified')) {
        setStatus('already_verified');
      } else {
        setStatus('invalid');
      }
    }
  };

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || resendCooldown > 0) return;

    setResendStatus('loading');
    try {
      await authService.resendVerification(resendEmail.trim());
      setResendStatus('sent');
      setResendCooldown(30);
    } catch {
      setResendStatus('sent'); // Generic anti-enumeration response
      setResendCooldown(30);
    }
  };

  const greetingName = getGreetingName(user?.fullName);
  const dark = theme === 'dark';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />
      <NebulaAuthHeader />

      <main
        className="flex-1 flex items-start md:items-center justify-center pt-14"
        aria-label="Email Verification"
      >
        <div className="w-full max-w-[420px] mx-auto px-6 md:px-0 py-10 md:py-16 relative z-10">
          {context && (
            <UnderstandingContextCard context={context} step="verify" />
          )}

          {/* 1. Verifying State */}
          {status === 'verifying' && (
            <div
              className="text-center py-8 space-y-4"
              role="status"
              aria-live="polite"
            >
              <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mx-auto bg-card/60">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <h1
                  className="font-serif text-[2.2rem] font-medium text-foreground leading-[1.1] tracking-tight"
                >
                  Verifying your
                  <br />
                  <em>identity.</em>
                </h1>
                <p
                  className="font-mono text-xs text-muted-foreground pt-1"
                >
                  Validating security token and establishing session...
                </p>
              </div>
            </div>
          )}

          {/* 2. Success State */}
          {status === 'success' && (
            <div
              className="flex flex-col gap-0"
              role="status"
              aria-live="polite"
            >
              <div className="w-12 h-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-8">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h1
                className="font-serif text-[2.3rem] md:text-[2.5rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
              >
                Email verified.
                <br />
                <em>
                  Welcome{greetingName !== 'there' ? `, ${greetingName}` : ''}.
                </em>
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Your authenticated session is active.
                {claimedDomain && !claimError ? (
                  <span className="block mt-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    Infrastructure understanding for {claimedDomain} has been
                    preserved in your workspace.
                  </span>
                ) : claimError ? (
                  <span className="block mt-1.5 font-medium text-amber-600 dark:text-amber-400">
                    {claimError}
                  </span>
                ) : (
                  ' Your workspace is ready.'
                )}
              </p>

              <a
                href="/workspace"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
              >
                <span>Enter Nebula Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* 3. Already Verified State */}
          {status === 'already_verified' && (
            <div className="flex flex-col gap-0">
              <div className="w-12 h-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-8">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h1
                className="font-serif text-[2.3rem] md:text-[2.5rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
              >
                Email already
                <br />
                <em>verified.</em>
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Your Nebula account is active.
                {isAuthenticated
                  ? ' You can enter your workspace directly.'
                  : ' Please sign in to access your workspace.'}
              </p>

              <div className="flex flex-col gap-3">
                {isAuthenticated ? (
                  <a
                    href="/workspace"
                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
                  >
                    <span>Enter Nebula Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <a
                    href="/login"
                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
                  >
                    <span>Sign In to Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}

                {isAuthenticated && (
                  <a
                    href="/login"
                    className="text-xs text-muted-foreground hover:text-foreground text-center underline pt-2"
                  >
                    Switch account / Sign in
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 4. Expired Token State */}
          {status === 'expired' && (
            <div className="flex flex-col gap-5">
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2.5"
              >
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">
                    Verification Link Expired
                  </p>
                  <p>
                    Verification links remain valid for 24 hours. Request a new
                    link below to continue.
                  </p>
                </div>
              </div>

              {/* Resend Box */}
              <div className="border border-border rounded-xl p-4 bg-card/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Send a new verification link</span>
                </div>

                {resendStatus === 'sent' ? (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>
                      New verification link sent to {maskEmail(resendEmail)}.
                      {resendCooldown > 0 && ` (${resendCooldown}s)`}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-2.5">
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      aria-label="Email address for new verification link"
                      className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-foreground/30"
                    />
                    <button
                      type="submit"
                      disabled={
                        resendStatus === 'loading' || resendCooldown > 0
                      }
                      className="w-full py-2 px-3 rounded-lg bg-foreground text-background font-medium text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {resendStatus === 'loading' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Send New Link'}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              <div className="text-center pt-2">
                <a
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Return to Sign In
                </a>
              </div>
            </div>
          )}

          {/* 5. Invalid Token State */}
          {status === 'invalid' && (
            <div className="flex flex-col gap-5">
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Invalid Link</p>
                  <p>
                    {errorMessage ||
                      'This verification link is no longer valid. It may have already been used or replaced by a new request.'}
                  </p>
                </div>
              </div>

              {/* Resend Box */}
              <div className="border border-border rounded-xl p-4 bg-card/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Send a new verification link</span>
                </div>

                {resendStatus === 'sent' ? (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>
                      If an account exists, a link was sent to {maskEmail(resendEmail)}.
                      {resendCooldown > 0 && ` (${resendCooldown}s)`}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-2.5">
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      aria-label="Email address for new verification link"
                      className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-foreground/30"
                    />
                    <button
                      type="submit"
                      disabled={
                        resendStatus === 'loading' || resendCooldown > 0
                      }
                      className="w-full py-2 px-3 rounded-lg bg-foreground text-background font-medium text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {resendStatus === 'loading' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Send New Link'}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              <div className="text-center pt-2">
                <a
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Return to Sign In
                </a>
              </div>
            </div>
          )}

          {/* 6. Idle / Manual Token Entry */}
          {status === 'idle' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="mb-6">
                <h1
                  className="font-serif text-[2.2rem] font-medium text-foreground leading-[1.1] tracking-tight mb-2"
                >
                  Verify your
                  <br />
                  <em>security token.</em>
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Paste the verification token provided in your email
                  confirmation.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="token-input"
                  className="font-mono text-[10px] tracking-[0.16em] uppercase font-medium text-muted-foreground"
                >
                  Security Token
                </label>
                <input
                  id="token-input"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token here"
                  className="font-mono bg-card border border-border text-foreground placeholder:text-muted-foreground/35 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-foreground/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Verify Token</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <a
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Return to Sign In
                </a>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
