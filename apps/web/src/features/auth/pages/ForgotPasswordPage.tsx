import React, { useState, type FormEvent } from 'react';
import { Mail, ArrowRight, Loader2, Check } from 'lucide-react';
import { authService } from '../../../services/auth';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import { Field } from '../components/Field';
import { validateEmail } from '../utils/validation';
import { maskEmail } from '../utils/email.util';

export const ForgotPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (hasSubmittedOnce) {
      setEmailError(validateEmail(val));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHasSubmittedOnce(true);

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setEmailError(undefined);
    setSubmitting(true);

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSubmittedEmail(email.trim());
    } catch {
      // Anti-enumeration: preserve identical UX success state even if backend returns generic or network error
      setSubmittedEmail(email.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const dark = theme === 'dark';

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />
      <NebulaAuthHeader />

      <main
        className="flex-1 flex items-start md:items-center justify-center pt-14"
        aria-label="Forgot Password Recovery"
      >
        <div className="w-full max-w-[420px] mx-auto px-6 md:px-0 py-10 md:py-16 relative z-10">
          {submittedEmail ? (
            /* Success State — Privacy Guard & Anti-Enumeration */
            <div className="flex flex-col gap-0" role="status" aria-live="polite">
              <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mb-6 bg-card/60">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>

              <h1 className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5">
                Check your<br />
                <em>email.</em>
              </h1>

              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-1">
                If an account exists for this address, password reset instructions have been sent to:
              </p>
              <p className="font-mono text-[13px] text-foreground mb-4 font-semibold">
                {maskEmail(submittedEmail)}
              </p>

              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-6">
                The password reset link will expire in 1 hour. If you do not see the email within a few minutes, check your spam folder.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-xs font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedEmail(null);
                    setEmail('');
                    setHasSubmittedOnce(false);
                  }}
                  className="text-[11.5px] font-mono text-muted-foreground hover:text-foreground text-center pt-2 underline cursor-pointer"
                >
                  Request another reset email
                </button>
              </div>
            </div>
          ) : (
            /* Initial Form State */
            <>
              <div className="mb-8">
                <h1 className="font-serif text-[2.5rem] md:text-[2.75rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3">
                  Reset your<br />
                  <em>password.</em>
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
                  Enter the email address associated with your Nebula account and we&apos;ll send you a password recovery link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <Field
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={emailError}
                  disabled={submitting}
                  required
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <a
                  href="/login"
                  className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors underline focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  ← Return to sign in
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
