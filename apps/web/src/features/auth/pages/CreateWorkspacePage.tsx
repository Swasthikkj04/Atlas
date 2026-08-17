import React, { useState, useEffect, type FormEvent } from 'react';
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

type Step = 'register' | 'check-email';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

function validate(name: string, email: string, password: string): FormErrors {
  const errs: FormErrors = {};
  if (!name.trim()) {
    errs.name = 'Please enter your full name.';
  } else if (name.trim().length < 2) {
    errs.name = 'Name must be at least 2 characters.';
  }

  if (!email.trim()) {
    errs.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errs.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errs.password = 'Please enter a password.';
  } else if (password.length < 8) {
    errs.password = 'Password must be at least 8 characters.';
  }

  return errs;
}

export const CreateWorkspacePage: React.FC = () => {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>('register');
  const [sentEmail, setSentEmail] = useState('');

  // Extract real guest context
  const [context] = useState<GuestUnderstandingContext>(() => {
    let domain = '';
    let expiresAt: Date | null = null;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      domain = params.get('domain') || '';

      try {
        const raw = sessionStorage.getItem('nebula_guest_claim');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!domain && parsed.domain) domain = parsed.domain;
          if (parsed.expiresAt) expiresAt = new Date(parsed.expiresAt);
        }
      } catch {
        // ignore storage parse errors
      }
    }

    return {
      domain: domain || 'your infrastructure',
      understandingType: 'Infrastructure Understanding',
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
            expiresAt: context.expiresAt?.toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }
  }, [context.expiresAt]);

  const searchParams = typeof window !== 'undefined' ? window.location.search : '';

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live re-validate after first attempt
  useEffect(() => {
    if (!attempted) return;
    setErrors(validate(name, email, password));
  }, [name, email, password, attempted]);

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(name, email, password);
    setAttempted(true);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError(null);
    setSubmitting(true);

    try {
      await authService.register({
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setSentEmail(email.trim().toLowerCase());
      setStep('check-email');
    } catch (err: any) {
      setApiError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend State
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (resending || !sentEmail) return;
    setResending(true);
    try {
      await authService.resendVerification(sentEmail);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {
      setResent(true); // Privacy policy: return consistent state
      setTimeout(() => setResent(false), 4000);
    } finally {
      setResending(false);
    }
  };

  const handleInitiateOAuth = (provider: 'google' | 'github') => {
    if (typeof window === 'undefined') return;

    // Preserve guest context in sessionStorage across external OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    const domainParam = params.get('domain');

    if (sessionParam || domainParam || (context.domain && context.domain !== 'your infrastructure')) {
      try {
        sessionStorage.setItem(
          'nebula_guest_claim',
          JSON.stringify({
            sessionId: sessionParam || '',
            domain: domainParam || (context.domain !== 'your infrastructure' ? context.domain : ''),
            expiresAt: context.expiresAt ? new Date(context.expiresAt).toISOString() : null,
          })
        );
      } catch {
        // ignore
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
          {/* UnderstandingContextCard — always visible across steps */}
          <UnderstandingContextCard context={context} step={step} />

          {/* Step 1: Register */}
          {step === 'register' && (
            <>
              <div className="mb-8">
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
              </div>

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
                  error={errors.name}
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
                      Create account
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
                We sent a verification link to
              </p>
              <p
                style={{ fontFamily: MONO }}
                className="text-[13px] text-foreground mb-5 font-semibold"
              >
                {sentEmail}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Open the email and verify your account. Your infrastructure understanding will be preserved automatically.
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
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
                      <RefreshCw className="w-4 h-4" /> Resend email
                    </>
                  )}
                </button>
                <p
                  style={{ fontFamily: MONO }}
                  className="text-[11px] text-muted-foreground/60 text-center"
                >
                  Check your spam folder if you don&apos;t see it.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateWorkspacePage;
