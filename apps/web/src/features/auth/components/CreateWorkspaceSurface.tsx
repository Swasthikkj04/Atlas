import React, { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  RefreshCw,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { authService } from '../../../services/auth';
import { useAuth } from '../hooks/useAuth';
import {
  UnderstandingContextCard,
  type GuestUnderstandingContext,
} from './UnderstandingContextCard';
import { Field } from './Field';
import { OAuthButtons } from './OAuthButtons';

const SERIF = "'Lora', 'Newsreader', Georgia, serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

export interface CreateWorkspaceSurfaceProps {
  domain: string;
  sessionId?: string;
  jobId?: string;
  expiresAt?: Date | null;
  onClose?: () => void;
  reduced?: boolean;
}

type Step = 'register' | 'check-email' | 'login';

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

export const CreateWorkspaceSurface: React.FC<CreateWorkspaceSurfaceProps> = ({
  domain,
  sessionId,
  jobId,
  expiresAt,
  onClose,
  reduced = false,
}) => {
  const { login, checkAndClaimGuestSession } = useAuth();
  const [step, setStep] = useState<Step>('register');
  const [sentEmail, setSentEmail] = useState('');

  // Live guest context
  const context: GuestUnderstandingContext = {
    domain: domain || 'your infrastructure',
    understandingType: 'Infrastructure Understanding',
    expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  // Ensure guest session is persisted to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionId || domain) {
      try {
        sessionStorage.setItem(
          'nebula_guest_claim',
          JSON.stringify({
            sessionId: sessionId || '',
            domain: domain || '',
            jobId: jobId || '',
            expiresAt: context.expiresAt?.toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }
  }, [sessionId, domain, jobId, context.expiresAt]);

  // Registration Form State
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

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter your email and password.');
      return;
    }

    setLoginError(null);
    setLoginSubmitting(true);

    try {
      await login({ email: loginEmail.trim(), password: loginPassword });
      try {
        await checkAndClaimGuestSession();
      } catch {
        // non-blocking claim fallback
      }
      window.location.href = '/dashboard';
    } catch (err: any) {
      setLoginError(
        err?.message || 'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoginSubmitting(false);
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
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } finally {
      setResending(false);
    }
  };

  const handleInitiateOAuth = (provider: 'google' | 'github') => {
    if (typeof window === 'undefined') return;

    if (sessionId || domain) {
      try {
        sessionStorage.setItem(
          'nebula_guest_claim',
          JSON.stringify({
            sessionId: sessionId || '',
            domain: domain || '',
            jobId: jobId || '',
            expiresAt: context.expiresAt?.toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }

    window.location.href = `/api/v1/auth/${provider}`;
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 12 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workspace-title"
      className="w-full max-w-[440px] mx-auto bg-card border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_56px_rgba(0,0,0,0.48)] relative z-50 text-foreground"
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-border/50">
        <span
          style={{ fontFamily: MONO }}
          className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold"
        >
          {step === 'login' ? 'Sign In · Nebula' : 'Preserve Understanding'}
        </span>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Return to understanding"
            className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70 hover:text-foreground transition-colors p-1 -mr-1 rounded cursor-pointer"
          >
            <span className="hidden sm:inline">Back to report</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* UnderstandingContextCard — always visible across steps */}
      <UnderstandingContextCard context={context} step={step === 'login' ? 'login' : step} />

      {/* ── STEP 1: REGISTER ────────────────────────────────────────────── */}
      {step === 'register' && (
        <>
          <div className="mb-6">
            <h2
              id="create-workspace-title"
              style={{ fontFamily: SERIF }}
              className="text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
            >
              Your understanding<br />
              <em>is ready to preserve.</em>
            </h2>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
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
            className="flex flex-col gap-3.5"
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
              className="mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
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

          <p className="mt-5 text-[11.5px] text-muted-foreground text-center">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setStep('login')}
              className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded font-medium cursor-pointer"
            >
              Log in →
            </button>
          </p>
        </>
      )}

      {/* ── STEP 2: CHECK EMAIL ─────────────────────────────────────────── */}
      {step === 'check-email' && (
        <div className="flex flex-col gap-0 pt-2">
          <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mb-6 bg-background">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>

          <h2
            id="create-workspace-title"
            style={{ fontFamily: SERIF }}
            className="text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
          >
            Check your<br />
            <em>email.</em>
          </h2>

          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-1">
            We sent a verification link to
          </p>
          <p
            style={{ fontFamily: MONO }}
            className="text-[13px] text-foreground mb-4 font-semibold"
          >
            {sentEmail}
          </p>
          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-6">
            Open the email and verify your account. Your infrastructure understanding will be preserved automatically.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex items-center justify-center gap-2 border border-border rounded-lg px-5 py-2.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer bg-background"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resending
                </>
              ) : resent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Email sent
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Resend email
                </>
              )}
            </button>
            <p
              style={{ fontFamily: MONO }}
              className="text-[10.5px] text-muted-foreground/60 text-center"
            >
              Check your spam folder if you don&apos;t see it.
            </p>
          </div>
        </div>
      )}

      {/* ── STEP 3: INLINE LOGIN ────────────────────────────────────────── */}
      {step === 'login' && (
        <>
          <div className="mb-6">
            <h2
              id="create-workspace-title"
              style={{ fontFamily: SERIF }}
              className="text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
            >
              Welcome back.<br />
              <em>Claim your understanding.</em>
            </h2>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              Sign in to claim this infrastructure understanding to your account.
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed"
            >
              {loginError}
            </div>
          )}

          <form
            className="flex flex-col gap-3.5"
            onSubmit={handleLoginSubmit}
            noValidate
            aria-label="Sign In to your account"
          >
            <Field
              label="Email"
              type="email"
              value={loginEmail}
              onChange={setLoginEmail}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loginSubmitting}
              required
            />
            <Field
              label="Password"
              type={loginShowPw ? 'text' : 'password'}
              value={loginPassword}
              onChange={setLoginPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loginSubmitting}
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setLoginShowPw((v) => !v)}
                  aria-label={loginShowPw ? 'Hide password' : 'Show password'}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {loginShowPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loginSubmitting}
              className="mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
            >
              {loginSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In & Claim
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <OAuthButtons
            onInitiateOAuth={handleInitiateOAuth}
            disabled={loginSubmitting}
          />

          <p className="mt-5 text-[11.5px] text-muted-foreground text-center">
            Need a new workspace?{' '}
            <button
              type="button"
              onClick={() => setStep('register')}
              className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded font-medium cursor-pointer"
            >
              Create account →
            </button>
          </p>
        </>
      )}
    </motion.div>
  );
};

export default CreateWorkspaceSurface;
