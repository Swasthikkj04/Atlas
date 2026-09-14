import React, { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  UnderstandingContextCard,
  type GuestUnderstandingContext,
} from './UnderstandingContextCard';
import { Field } from './Field';
import { OAuthButtons } from './OAuthButtons';
import { RegistrationForm } from './RegistrationForm';
import { CheckEmailView } from './CheckEmailView';

export interface CreateWorkspaceSurfaceProps {
  domain?: string;
  sessionId?: string;
  jobId?: string;
  expiresAt?: Date | null;
  onClose?: () => void;
  reduced?: boolean;
  mode?: 'context-aware' | 'direct';
}

type Step = 'register' | 'check-email' | 'login';

export const CreateWorkspaceSurface: React.FC<CreateWorkspaceSurfaceProps> = ({
  domain,
  sessionId,
  jobId,
  expiresAt,
  onClose,
  reduced = false,
  mode: propMode,
}) => {
  const { user, isAuthenticated, login, checkAndClaimGuestSession, claimGuestSession } = useAuth();
  const [step, setStep] = useState<Step>('register');
  const [sentEmail, setSentEmail] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const isContextAware = propMode === 'direct' ? false : Boolean(domain || sessionId || propMode === 'context-aware');

  // Live guest context (Mode A only)
  const [context] = useState<GuestUnderstandingContext | null>(() => {
    if (!isContextAware) return null;
    return {
      domain: domain || 'your infrastructure',
      understandingType: 'Infrastructure Understanding',
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  });

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
            expiresAt: context?.expiresAt?.toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }
  }, [sessionId, domain, jobId, context?.expiresAt]);

  const handleInitiateOAuth = (provider: 'google' | 'github') => {
    if (typeof window === 'undefined') return;

    if (isContextAware && (sessionId || domain)) {
      try {
        sessionStorage.setItem(
          'nebula_guest_claim',
          JSON.stringify({
            sessionId: sessionId || '',
            domain: domain || '',
            jobId: jobId || '',
            expiresAt: context?.expiresAt ? new Date(context.expiresAt).toISOString() : null,
          })
        );
      } catch {
        // ignore
      }
    }

    window.location.href = `/api/v1/auth/${provider}`;
  };

  const handleAuthenticatedClaim = async () => {
    setClaimError(null);
    setIsClaiming(true);

    try {
      if (sessionId) {
        await claimGuestSession(sessionId);
      } else {
        await checkAndClaimGuestSession();
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('nebula_guest_claim');
        sessionStorage.removeItem('nebula_claim_error');
      }
      window.location.href = '/workspace';
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Sorry, your domain limit has been reached.';
      setClaimError(msg);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nebula_claim_error', msg);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  // Inline Login Form State (Step 3)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setClaimError(null);
    setLoginSubmitting(true);

    try {
      await login({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      if (isContextAware) {
        try {
          await checkAndClaimGuestSession();
        } catch (claimErr: unknown) {
          const claimMsg =
            claimErr instanceof Error
              ? claimErr.message
              : 'Sorry, your domain limit has been reached.';
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('nebula_claim_error', claimMsg);
          }
        }
      }

      window.location.href = '/workspace';
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to authenticate. Please check your credentials.';
      setLoginError(msg);
    } finally {
      setLoginSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      role="region"
      aria-labelledby="create-workspace-title"
      className="w-full max-w-[460px] mx-auto bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl"
    >
      {/* Top Header Row with Title & Close Button */}
      <div className="flex items-center justify-between pb-3">
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {isContextAware ? 'Preserve Understanding' : 'Nebula Account'}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal and return to understanding report"
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* UnderstandingContextCard — visible in Mode A only */}
      {isContextAware && context && (
        <UnderstandingContextCard context={context} step={isAuthenticated ? 'verify' : step === 'login' ? 'login' : step} />
      )}

      {/* ── AUTHENTICATED USER VIEW ────────────────────────────────────── */}
      {isAuthenticated && user ? (
        <>
          <div className="mb-6">
            <h2
              id="create-workspace-title"
              className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
            >
              Preserve in workspace.<br />
              <em>{domain || 'Your infrastructure'}</em>
            </h2>
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              Signed in as <strong className="text-foreground">{user.fullName || user.email}</strong>. Claim this perimeter into your monitored workspace portfolio.
            </p>
          </div>

          {claimError && (
            <div
              role="alert"
              className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed space-y-1"
            >
              <div className="font-medium text-[13px]">{claimError}</div>
              <div className="text-muted-foreground text-[11.5px]">
                Your workspace already contains the maximum allowed 4 domains. Remove an existing domain to claim this infrastructure.
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!claimError ? (
              <button
                type="button"
                onClick={handleAuthenticatedClaim}
                disabled={isClaiming}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Claiming infrastructure...
                  </>
                ) : (
                  <>
                    Claim to Workspace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <a
                href="/workspace"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
              >
                Open Workspace
                <ArrowRight className="w-4 h-4" />
              </a>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center py-2 text-[11px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                ← Return to understanding report
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* ── STEP 1: REGISTER ────────────────────────────────────────────── */}
          {step === 'register' && (
            <>
              <div className="mb-6">
            {isContextAware ? (
              <>
                <h2
                  id="create-workspace-title"
                  className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
                >
                  Your understanding<br />
                  <em>is ready to preserve.</em>
                </h2>
                <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                  Create an account to claim this understanding before it expires.
                </p>
              </>
            ) : (
              <>
                <h2
                  id="create-workspace-title"
                  className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
                >
                  Create your workspace.
                </h2>
                <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                  Your place to understand what changed across your infrastructure.
                </p>
              </>
            )}
          </div>

          <RegistrationForm
            onRegistrationSuccess={(email) => {
              setSentEmail(email);
              setStep('check-email');
            }}
            onInitiateOAuth={handleInitiateOAuth}
            onSwitchToLogin={() => setStep('login')}
          />

          {onClose && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                ← Return to understanding report
              </button>
            </div>
          )}
        </>
      )}

      {/* ── STEP 2: CHECK EMAIL ─────────────────────────────────────────── */}
      {step === 'check-email' && (
        <CheckEmailView
          email={sentEmail}
          isContextAware={isContextAware}
          onEditEmail={() => setStep('register')}
          onClose={onClose}
        />
      )}

      {/* ── STEP 3: INLINE LOGIN ────────────────────────────────────────── */}
      {step === 'login' && (
        <>
          <div className="mb-6">
            <h2
              id="create-workspace-title"
              className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
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

          {onClose && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                ← Return to understanding report
              </button>
            </div>
          )}
        </>
      )}
        </>
      )}
    </motion.div>
  );
};

export default CreateWorkspaceSurface;
