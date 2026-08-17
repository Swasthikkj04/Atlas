import React, { useState, type FormEvent } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
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

export const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const { login, checkAndClaimGuestSession } = useAuth();

  // Extract real guest context if attempting to claim on login
  const [context] = useState<GuestUnderstandingContext | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const domain = params.get('domain');
      if (domain) {
        return {
          domain,
          understandingType: 'Infrastructure Understanding',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
      }
      try {
        const raw = sessionStorage.getItem('nebula_guest_claim');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.domain) {
            return {
              domain: parsed.domain,
              understandingType: 'Infrastructure Understanding',
              expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            };
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  const searchParams = typeof window !== 'undefined' ? window.location.search : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setIsPendingVerification(false);
    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      try {
        await checkAndClaimGuestSession();
      } catch {
        // non-blocking claim fallback
      }
      window.location.href = '/dashboard';
    } catch (err: any) {
      const message = err?.message || 'Authentication failed. Please check your credentials.';
      setError(message);
      if (message.toLowerCase().includes('verify your email') || message.toLowerCase().includes('verification required')) {
        setIsPendingVerification(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    try {
      await authService.resendVerification(email.trim());
      setResendSent(true);
      setTimeout(() => setResendSent(false), 4000);
    } catch {
      setResendSent(true);
      setTimeout(() => setResendSent(false), 4000);
    }
  };

  const handleInitiateOAuth = (provider: 'google' | 'github') => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    const domainParam = params.get('domain');

    if (sessionParam || domainParam || context?.domain) {
      try {
        sessionStorage.setItem(
          'nebula_guest_claim',
          JSON.stringify({
            sessionId: sessionParam || '',
            domain: domainParam || context?.domain || '',
            expiresAt: context?.expiresAt ? new Date(context.expiresAt).toISOString() : null,
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
        aria-label="Sign In"
      >
        <div className="w-full max-w-[420px] mx-auto px-6 md:px-0 py-10 md:py-16 relative z-10">
          {/* UnderstandingContextCard if claiming */}
          {context && (
            <UnderstandingContextCard context={context} step="login" />
          )}

          <div className="mb-8">
            <h1
              style={{ fontFamily: SERIF }}
              className="text-[2.5rem] md:text-[2.75rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
            >
              Welcome back.<br />
              <em>Continue understanding.</em>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
              Sign in to your Nebula workspace and causal memory.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed"
            >
              <p className="font-semibold mb-0.5">Authentication Error</p>
              <p>{error}</p>
              {isPendingVerification && (
                <div className="mt-2 pt-2 border-t border-destructive/20">
                  {resendSent ? (
                    <span className="text-emerald-500 font-medium">New verification email dispatched.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="underline font-medium hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      Resend verification email →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Sign In to your account"
          >
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={submitting}
              required
            />
            <Field
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={submitting}
              required
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
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
            Don&apos;t have an account?{' '}
            <a
              href={`/create-workspace${searchParams}`}
              className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded font-medium"
              aria-label="Create a new workspace account"
            >
              Create workspace →
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
