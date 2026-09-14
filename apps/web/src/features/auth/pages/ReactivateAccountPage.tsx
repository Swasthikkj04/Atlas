import React, { useState, useEffect, type FormEvent } from 'react';
import {
  Mail,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { authService } from '../../../services/auth';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import { Field } from '../components/Field';
import { validateReactivationEmail } from '../contracts/reactivation.contract';

export type ReactivationState =
  | 'idle'
  | 'requesting'
  | 'request_sent'
  | 'verifying_token'
  | 'token_success'
  | 'token_error';

export const ReactivateAccountPage: React.FC = () => {
  const { theme } = useTheme();
  const { refetchUser } = useAuth();

  const [token] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    }
    return '';
  });
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [state, setState] = useState<ReactivationState>(
    token ? 'verifying_token' : 'idle'
  );
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function executeReactivation() {
      try {
        const response = await authService.confirmReactivation(token);
        if (!isMounted) return;

        setServerMessage(
          response.message || 'Your account has been successfully reactivated.'
        );
        setState('token_success');
        await refetchUser();

        // Redirect after calm confirmation
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.assign('/workspace');
          }
        }, 1500);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Reactivation link has expired or has already been used.';
        setErrorMessage(msg);
        setState('token_error');
      }
    }

    void executeReactivation();

    return () => {
      isMounted = false;
    };
  }, [token, refetchUser]);

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validateReactivationEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.error);
      return;
    }
    setEmailError(undefined);

    setState('requesting');

    try {
      const response = await authService.requestReactivation(email);
      setServerMessage(
        response.message ||
          'If an eligible deactivated account is associated with this email, a secure reactivation link has been sent.'
      );
      setState('request_sent');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to request reactivation link. Please try again.';
      setErrorMessage(msg);
      setState('idle');
    }
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between relative overflow-hidden font-sans transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#050608] text-slate-100'
      }`}
    >
      <NetworkBg />
      <NebulaAuthHeader />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 z-10 py-12">
        <div
          className={`w-full max-w-[420px] rounded-2xl border p-8 shadow-2xl backdrop-blur-xl transition-all ${
            isLight
              ? 'bg-white/80 border-slate-200 shadow-slate-200/50'
              : 'bg-[#0B0D13]/80 border-white/[0.08] shadow-black/60'
          }`}
        >
          {/* Case 1: Verifying Token from URL */}
          {state === 'verifying_token' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">
                  Restoring Account Access
                </h1>
                <p className="text-xs text-muted-foreground">
                  Verifying one-time reactivation token and preparing workspace...
                </p>
              </div>
            </div>
          )}

          {/* Case 2: Token Verification Success */}
          {state === 'token_success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-emerald-500">
                  Account Reactivated
                </h1>
                <p className="text-xs text-muted-foreground">
                  {serverMessage || 'Welcome back. Redirecting to your workspace...'}
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/workspace"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Case 3: Token Verification Error */}
          {state === 'token_error' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-destructive">
                  Reactivation Failed
                </h1>
                <p className="text-xs text-muted-foreground">
                  {errorMessage || 'This reactivation link is invalid, expired, or has already been used.'}
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setState('idle');
                    setErrorMessage(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Request a New Link</span>
                </button>
                <div className="pt-2">
                  <a
                    href="/auth/login"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Return to sign in
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Case 4: Request Sent (Calm Email Notice) */}
          {state === 'request_sent' && (
            <div className="text-center py-4 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-lg font-semibold tracking-tight">
                  Check your email
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {serverMessage || "We've sent a secure reactivation link to your email address."}
                </p>
                <p className="text-[11px] text-muted-foreground/80 pt-1">
                  The link expires in 15 minutes and can only be used once.
                </p>
              </div>

              <div className="pt-3 border-t border-border-hairline space-y-3">
                <p className="text-xs text-muted-foreground">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    onClick={() => setState('idle')}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Resend email
                  </button>
                </p>
                <div>
                  <a
                    href="/auth/login"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Return to sign in
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Case 5: Idle / Email Request Form */}
          {(state === 'idle' || state === 'requesting') && (
            <div className="space-y-6">
              <div className="space-y-1.5 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted border border-border-hairline text-muted-foreground mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Account Recovery</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Reactivate your account
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your Nebula account is currently deactivated. Enter your email to receive a secure reactivation link.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <Field
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(val) => {
                    setEmail(val);
                    if (emailError) setEmailError(undefined);
                  }}
                  placeholder="name@example.com"
                  error={emailError}
                  disabled={state === 'requesting'}
                  required
                />

                <button
                  type="submit"
                  disabled={state === 'requesting' || !email.trim()}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  {state === 'requesting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reactivation link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center border-t border-border-hairline">
                <a
                  href="/auth/login"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Return to sign in
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground z-10">
        &copy; {new Date().getFullYear()} Nebula &bull; Argonion Inc.
      </footer>
    </div>
  );
};

ReactivateAccountPage.displayName = 'ReactivateAccountPage';

export default ReactivateAccountPage;

