import React, { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  RefreshCw,
  Loader2,
  Check,
} from 'lucide-react';
import { authService } from '../../../services/auth';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import {
  UnderstandingContextCard,
  type GuestUnderstandingContext,
} from '../components/UnderstandingContextCard';
import { Field } from '../components/Field';
import { OAuthButtons } from '../components/OAuthButtons';

const SERIF = "'Lora', 'Newsreader', Georgia, serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

export type CreateWorkspaceMode = 'context-aware' | 'direct';

export interface CreateWorkspacePageProps {
  mode?: CreateWorkspaceMode;
}

type Step = 'register' | 'check-email';

import {
  validateRegistration,
  hasErrors,
  getPasswordStrength,
  type RegistrationErrors,
} from '../utils/validation';
import { maskEmail } from '../utils/email.util';

export const CreateWorkspacePage: React.FC<CreateWorkspacePageProps> = ({ mode: propMode }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>('register');
  const [sentEmail, setSentEmail] = useState('');

  // 1. Determine Mode: Context-Aware (Mode A) vs. Direct (Mode B)
  const isContextAware = useMemo(() => {
    if (propMode === 'context-aware') return true;
    if (propMode === 'direct') return false;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'direct') return false;
      if (params.get('mode') === 'guest' || params.get('mode') === 'context-aware') return true;
      const sessionParam = params.get('session');
      const domainParam = params.get('domain');
      if (sessionParam || domainParam) return true;
    }
    return false;
  }, [propMode]);

  // 2. Extract Guest Context only in Context-Aware Mode (Never in Direct Mode)
  const [context] = useState<GuestUnderstandingContext | null>(() => {
    if (!isContextAware || typeof window === 'undefined') {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain') || '';
    let expiresAt: Date | null = null;

    try {
      const raw = sessionStorage.getItem('nebula_guest_claim');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiresAt) expiresAt = new Date(parsed.expiresAt);
      }
    } catch {
      // ignore
    }

    return {
      domain: domain || 'your infrastructure',
      understandingType: 'Infrastructure Understanding',
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  });

  // 3. Persist Guest Session into storage ONLY in Context-Aware Mode
  useEffect(() => {
    if (!isContextAware || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    const domainParam = params.get('domain');

    if (sessionParam || domainParam) {
      try {
        sessionStorage.setItem(
          'nebula_guest_claim',
          JSON.stringify({
            sessionId: sessionParam || '',
            domain: domainParam || '',
            expiresAt: context?.expiresAt?.toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }
  }, [isContextAware, context?.expiresAt]);

  const searchParams = isContextAware && typeof window !== 'undefined' ? window.location.search : '';

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const errors: RegistrationErrors = attempted
    ? validateRegistration({
        fullName: name,
        email,
        password,
        confirmPassword,
      })
    : {};

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setEmailExists(false);
    setApiError(null);

    const validationErrors = validateRegistration({
      fullName: name,
      email,
      password,
      confirmPassword,
    });

    if (hasErrors(validationErrors)) {
      return;
    }

    setSubmitting(true);

    try {
      await authService.register({
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });
      setSentEmail(email.trim().toLowerCase());
      setStep('check-email');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';

      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already associated') ||
        msg.toLowerCase().includes('already exists')
      ) {
        setEmailExists(true);
      } else {
        setApiError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Resend State
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resending || !sentEmail || resendCooldown > 0) return;
    setResending(true);
    try {
      await authService.resendVerification(sentEmail);
      setResent(true);
      setResendCooldown(30);
      setTimeout(() => setResent(false), 4000);
    } catch {
      setResent(true); // Privacy policy: return consistent state
      setResendCooldown(30);
      setTimeout(() => setResent(false), 4000);
    } finally {
      setResending(false);
    }
  };

  const handleInitiateOAuth = (provider: 'google' | 'github') => {
    if (typeof window === 'undefined') return;

    if (isContextAware) {
      // Preserve guest context in sessionStorage across external OAuth redirect
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const domainParam = params.get('domain');

      if (sessionParam || domainParam || (context?.domain && context.domain !== 'your infrastructure')) {
        try {
          sessionStorage.setItem(
            'nebula_guest_claim',
            JSON.stringify({
              sessionId: sessionParam || '',
              domain: domainParam || (context?.domain !== 'your infrastructure' ? context?.domain : ''),
              expiresAt: context?.expiresAt ? new Date(context.expiresAt).toISOString() : null,
            })
          );
        } catch {
          // ignore
        }
      }
    }

    window.location.href = `/api/v1/auth/${provider}`;
  };

  const dark = theme === 'dark';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />
      <NebulaAuthHeader />

      <main
        className="flex-1 flex items-start md:items-center justify-center pt-14"
        aria-label="Create workspace"
      >
        <div className="w-full max-w-[420px] mx-auto px-6 md:px-0 py-10 md:py-16 relative z-10">
          {/* Context Card (Mode A only) */}
          {isContextAware && context && (
            <UnderstandingContextCard context={context} step={step} />
          )}

          {/* Step 1: Register */}
          {step === 'register' && (
            <>
              <div className="mb-8">
                {isContextAware ? (
                  <>
                    <h1
                      style={{ fontFamily: SERIF }}
                      className="text-[2.5rem] md:text-[2.75rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
                    >
                      Your understanding<br />
                      <em>is ready to preserve.</em>
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
                      Create an account to claim this understanding before it expires.
                    </p>
                  </>
                ) : (
                  <>
                    <h1
                      style={{ fontFamily: SERIF }}
                      className="text-[2.5rem] md:text-[2.75rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
                    >
                      Create your workspace.
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
                      Your place to understand what changed across your infrastructure.
                    </p>
                  </>
                )}
              </div>

              {emailExists && (
                <div
                  role="alert"
                  className="mb-4 p-3.5 rounded-xl bg-card border border-border text-foreground text-xs leading-relaxed flex flex-col gap-1.5 shadow-sm"
                >
                  <p className="font-medium text-foreground">
                    This email is already associated with a Nebula account.
                  </p>
                  <a
                    href={`/login${searchParams}`}
                    className="text-primary font-medium underline underline-offset-2 hover:opacity-80 transition-opacity inline-flex items-center gap-1"
                  >
                    Log in instead →
                  </a>
                </div>
              )}

              {apiError && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed"
                >
                  {apiError}
                </div>
              )}

              <form
                className="flex flex-col gap-4"
                onSubmit={handleRegisterSubmit}
                noValidate
                aria-label="Create workspace account"
              >
                <Field
                  label="Full name"
                  value={name}
                  onChange={setName}
                  placeholder="Swasthik"
                  error={errors.fullName}
                  autoComplete="name"
                  disabled={submitting}
                />
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  error={errors.email}
                  autoComplete="email"
                  disabled={submitting}
                />
                <Field
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  error={errors.password}
                  autoComplete="new-password"
                  disabled={submitting}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
                {password.length > 0 && (
                  <div className="flex items-center justify-between gap-2 px-1 -mt-2 mb-1">
                    <div className="flex gap-1 flex-1 max-w-[120px]">
                      <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          getPasswordStrength(password) === 'weak'
                            ? 'bg-amber-500/80'
                            : 'bg-emerald-500/80'
                        }`}
                      />
                      <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          getPasswordStrength(password) === 'fair' ||
                          getPasswordStrength(password) === 'strong'
                            ? 'bg-emerald-500/80'
                            : 'bg-muted/40'
                        }`}
                      />
                      <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          getPasswordStrength(password) === 'strong'
                            ? 'bg-emerald-500'
                            : 'bg-muted/40'
                        }`}
                      />
                    </div>
                    <span
                      style={{ fontFamily: MONO }}
                      className="text-[10px] text-muted-foreground uppercase tracking-wider"
                    >
                      {getPasswordStrength(password) === 'weak'
                        ? 'Needs Strength'
                        : getPasswordStrength(password) === 'fair'
                        ? 'Good'
                        : 'Strong'}
                    </span>
                  </div>
                )}
                <Field
                  label="Confirm password"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  disabled={submitting}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      {showConfirmPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating your workspace...
                    </>
                  ) : (
                    <>
                      Create workspace
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <OAuthButtons
                onInitiateOAuth={handleInitiateOAuth}
                disabled={submitting}
              />

              <p className="mt-6 text-[12px] text-muted-foreground text-center">
                Already have an account?{' '}
                <a
                  href={`/login${searchParams}`}
                  className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded font-medium"
                  aria-label="Log in to your existing account"
                >
                  Log in →
                </a>
              </p>
            </>
          )}

          {/* Step 2: Check Email */}
          {step === 'check-email' && (
            <div className="flex flex-col gap-0">
              <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mb-8 bg-card/60">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>

              <h1
                style={{ fontFamily: SERIF }}
                className="text-[2.3rem] md:text-[2.5rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
              >
                Check your<br />
                <em>email.</em>
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                We&apos;ve sent a verification link to
              </p>
              <p
                style={{ fontFamily: MONO }}
                className="text-[13px] text-foreground mb-5 font-semibold"
              >
                {maskEmail(sentEmail)}
              </p>

              {isContextAware ? (
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Open the email and verify your account. Your infrastructure understanding will be preserved automatically.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Verify your email to finish creating your Nebula workspace. This link expires in 24 hours.
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="flex items-center justify-center gap-2 border border-border rounded-lg px-6 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer bg-card"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Resending
                    </>
                  ) : resent ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Email sent
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        {resendCooldown > 0
                          ? `Resend available in ${resendCooldown}s`
                          : 'Resend email'}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                  <span style={{ fontFamily: MONO }}>
                    Check spam folder if delayed
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('register')}
                    className="text-foreground underline hover:opacity-75 cursor-pointer"
                  >
                    Entered wrong address?
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

CreateWorkspacePage.displayName = 'CreateWorkspacePage';
export default CreateWorkspacePage;
