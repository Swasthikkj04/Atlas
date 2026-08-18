import React, { useState, type FormEvent } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '../../../services/auth';
import { Field } from './Field';
import { OAuthButtons } from './OAuthButtons';
import {
  validateRegistration,
  hasErrors,
  getPasswordStrength,
  type RegistrationErrors,
} from '../utils/validation';

export interface RegistrationFormProps {
  onRegistrationSuccess: (email: string) => void;
  onInitiateOAuth?: (provider: 'google' | 'github') => void;
  onSwitchToLogin?: () => void;
  loginHref?: string;
  className?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onRegistrationSuccess,
  onInitiateOAuth,
  onSwitchToLogin,
  loginHref = '/login',
  className = '',
}) => {
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
      onRegistrationSuccess(email.trim().toLowerCase());
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

  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  return (
    <div className={className}>
      {emailExists && (
        <div
          role="alert"
          className="mb-4 p-3.5 rounded-xl bg-card border border-border text-foreground text-xs leading-relaxed flex flex-col gap-1.5 shadow-sm"
        >
          <p className="font-medium text-foreground">
            This email is already associated with a Nebula account.
          </p>
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary font-medium underline underline-offset-2 hover:opacity-80 transition-opacity inline-flex items-center gap-1 cursor-pointer text-left w-fit"
            >
              Log in instead →
            </button>
          ) : (
            <a
              href={loginHref}
              className="text-primary font-medium underline underline-offset-2 hover:opacity-80 transition-opacity inline-flex items-center gap-1"
            >
              Log in instead →
            </a>
          )}
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
        {strength && (
          <div className="flex items-center justify-between gap-2 px-1 -mt-1.5 mb-1">
            <div className="flex gap-1 flex-1 max-w-[120px]">
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${
                  strength === 'weak'
                    ? 'bg-amber-500/80'
                    : 'bg-emerald-500/80'
                }`}
              />
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${
                  strength === 'fair' || strength === 'strong'
                    ? 'bg-emerald-500/80'
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
          className="mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
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
        onInitiateOAuth={onInitiateOAuth}
        disabled={submitting}
      />

      <p className="mt-5 text-[11.5px] text-muted-foreground text-center">
        Already have an account?{' '}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded font-medium cursor-pointer"
          >
            Log in →
          </button>
        ) : (
          <a
            href={loginHref}
            className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded font-medium"
            aria-label="Log in to your existing account"
          >
            Log in →
          </a>
        )}
      </p>
    </div>
  );
};
