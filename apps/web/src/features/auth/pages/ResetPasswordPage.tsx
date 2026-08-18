import React, { useState, type FormEvent } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { authService } from '../../../services/auth';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import { Field } from '../components/Field';
import {
  validatePassword,
  validateConfirmPassword,
  getPasswordStrength,
  type PasswordStrengthLevel,
} from '../utils/validation';

export const ResetPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const [token] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isTokenInvalid, setIsTokenInvalid] = useState(!token);

  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const strength: PasswordStrengthLevel = getPasswordStrength(password);

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (hasSubmittedOnce) {
      setPasswordError(validatePassword(val));
      if (confirmPassword) {
        setConfirmError(validateConfirmPassword(confirmPassword, val));
      }
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (hasSubmittedOnce) {
      setConfirmError(validateConfirmPassword(val, password));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHasSubmittedOnce(true);
    setApiError(null);

    const pwErr = validatePassword(password);
    const confErr = validateConfirmPassword(confirmPassword, password);

    setPasswordError(pwErr);
    setConfirmError(confErr);

    if (pwErr || confErr) {
      return;
    }

    setSubmitting(true);

    try {
      await authService.resetPassword({
        token,
        password,
      });
      setResetSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Password reset link is invalid or has expired.';

      if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('token')
      ) {
        setIsTokenInvalid(true);
      } else {
        setApiError(msg);
      }
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
        aria-label="Password Reset Form"
      >
        <div className="w-full max-w-[420px] mx-auto px-6 md:px-0 py-10 md:py-16 relative z-10">
          {/* 1. Invalid or Expired Token State */}
          {isTokenInvalid ? (
            <div className="flex flex-col gap-0" role="alert">
              <div className="w-12 h-12 rounded-xl border border-destructive/30 bg-destructive/10 flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>

              <h1 className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5">
                Invalid reset<br />
                <em>link.</em>
              </h1>

              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-6">
                This password reset link is invalid, has already been used, or has expired. Password reset links are single-use and expire after 1 hour.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href="/auth/forgot-password"
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-xs font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
                >
                  <span>Request a New Reset Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href="/login"
                  className="text-[11.5px] font-mono text-muted-foreground hover:text-foreground text-center pt-2 underline"
                >
                  Return to Sign In
                </a>
              </div>
            </div>
          ) : resetSuccess ? (
            /* 2. Success State */
            <div className="flex flex-col gap-0" role="status" aria-live="polite">
              <div className="w-12 h-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-6">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h1 className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5">
                Password<br />
                <em>updated.</em>
              </h1>

              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-6">
                Your password has been reset successfully. All existing active sessions have been revoked for your security. Please log in with your new password.
              </p>

              <a
                href="/login"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
              >
                <span>Sign In to Nebula</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            /* 3. Password Reset Form */
            <>
              <div className="mb-8">
                <h1 className="font-serif text-[2.5rem] md:text-[2.75rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3">
                  Choose new<br />
                  <em>password.</em>
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
                  Enter a strong, unique password for your Nebula account.
                </p>
              </div>

              {apiError && (
                <div
                  role="alert"
                  className="mb-4 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                {/* Password Field */}
                <div>
                  <Field
                    label="New Password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    error={passwordError}
                    autoComplete="new-password"
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

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex flex-1 items-center gap-1.5">
                        <div
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength === 'weak'
                              ? 'bg-destructive'
                              : strength === 'fair'
                              ? 'bg-amber-500/80'
                              : strength === 'strong'
                              ? 'bg-emerald-500'
                              : 'bg-muted/40'
                          }`}
                        />
                        <div
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength === 'fair'
                              ? 'bg-amber-500/80'
                              : strength === 'strong'
                              ? 'bg-emerald-500'
                              : 'bg-muted/40'
                          }`}
                        />
                        <div
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength === 'strong'
                              ? 'bg-emerald-500'
                              : 'bg-muted/40'
                          }`}
                        />
                      </div>
                      <span
                        className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
                      >
                        {strength === 'weak'
                          ? 'Needs Strength'
                          : strength === 'fair'
                          ? 'Good'
                          : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <Field
                  label="Confirm New Password"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="••••••••"
                  error={confirmError}
                  autoComplete="new-password"
                  disabled={submitting}
                  required
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
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
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

export default ResetPasswordPage;
