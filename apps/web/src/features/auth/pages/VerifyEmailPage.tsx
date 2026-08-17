import React, { useState, useEffect, type FormEvent } from 'react';
import { Check, ArrowRight, Loader2, Mail, Send, AlertCircle } from 'lucide-react';
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

const SERIF = "'Lora', 'Newsreader', Georgia, serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

export const VerifyEmailPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated, verifyEmail, checkAndClaimGuestSession } = useAuth();

  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>(
    token ? 'verifying' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);

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

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function executeVerification() {
      try {
        await verifyEmail(token);
        if (!isMounted) return;

        setStatus('success');

        // Claim guest session if present
        try {
          const claimResult = await checkAndClaimGuestSession();
          if (claimResult?.domainName && isMounted) {
            setClaimedDomain(claimResult.domainName);
          }
        } catch {
          // non-blocking
        }

        const timer = setTimeout(() => {
          if (isMounted) {
            window.location.href = '/dashboard';
          }
        }, 1800);

        return () => clearTimeout(timer);
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            err?.message || 'Verification link is invalid or has expired.'
          );
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
    if (!token.trim()) return;

    setStatus('verifying');
    setErrorMessage(null);

    try {
      await verifyEmail(token.trim());
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
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(
        err?.message || 'Verification link is invalid or has expired.'
      );
    }
  };

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendStatus('loading');
    try {
      await authService.resendVerification(resendEmail.trim());
      setResendStatus('sent');
    } catch {
      setResendStatus('sent');
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
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mx-auto bg-card/60">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <h1
                  style={{ fontFamily: SERIF }}
                  className="text-[2.2rem] font-medium text-foreground leading-[1.1] tracking-tight"
                >
                  Verifying your<br />
                  <em>identity.</em>
                </h1>
                <p
                  style={{ fontFamily: MONO }}
                  className="text-xs text-muted-foreground pt-1"
                >
                  Validating security token and establishing session...
                </p>
              </div>
            </div>
          )}

          {/* 2. Success State */}
          {status === 'success' && (
            <div className="flex flex-col gap-0">
              <div className="w-12 h-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-8">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h1
                style={{ fontFamily: SERIF }}
                className="text-[2.3rem] md:text-[2.5rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
              >
                Email verified.<br />
                <em>
                  Welcome{greetingName !== 'there' ? `, ${greetingName}` : ''}.
                </em>
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Your authenticated session is active.
                {claimedDomain ? (
                  <span className="block mt-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    Infrastructure understanding for {claimedDomain} has been preserved in your workspace.
                  </span>
                ) : (
                  ' Your workspace is ready.'
                )}
              </p>

              <a
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
              >
                <span>Enter Nebula Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* 3. Error State */}
          {status === 'error' && (
            <div className="flex flex-col gap-5">
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Verification Failed</p>
                  <p>{errorMessage}</p>
                </div>
              </div>

              {isAuthenticated && (
                <a
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <span>Continue to Active Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Resend Box */}
              <div className="border border-border rounded-xl p-4 bg-card/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Request a fresh verification link</span>
                </div>

                {resendStatus === 'sent' ? (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>If an unverified account exists, a link was sent.</span>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-2.5">
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-foreground/30"
                    />
                    <button
                      type="submit"
                      disabled={resendStatus === 'loading'}
                      className="w-full py-2 px-3 rounded-lg bg-foreground text-background font-medium text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {resendStatus === 'loading' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Send New Link</span>
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

          {/* 4. Idle / Manual Token Entry */}
          {status === 'idle' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="mb-6">
                <h1
                  style={{ fontFamily: SERIF }}
                  className="text-[2.2rem] font-medium text-foreground leading-[1.1] tracking-tight mb-2"
                >
                  Verify your<br />
                  <em>security token.</em>
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Paste the verification token provided in your email confirmation.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="token-input"
                  style={{ fontFamily: MONO }}
                  className="text-[10px] tracking-[0.16em] uppercase font-medium text-muted-foreground"
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
                  style={{ fontFamily: MONO }}
                  className="bg-card border border-border text-foreground placeholder:text-muted-foreground/35 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-foreground/30"
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
