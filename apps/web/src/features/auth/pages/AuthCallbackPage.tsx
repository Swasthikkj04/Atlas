import React, { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle, ArrowRight, Mail, ShieldAlert, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import {
  UnderstandingContextCard,
  type GuestUnderstandingContext,
} from '../components/UnderstandingContextCard';
import { getGreetingName } from '../utils/name.util';
import { mapOAuthError } from '../utils/oauth-error.util';

export const AuthCallbackPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, refetchUser, checkAndClaimGuestSession } = useAuth();

  const [initialError] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('error');
    }
    return null;
  });

  const [emailParam] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email');
    }
    return null;
  });

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(() =>
    initialError ? 'error' : 'processing',
  );
  const [errorCode, setErrorCode] = useState<string | null>(initialError);
  const [genericErrorMessage, setGenericErrorMessage] = useState<string | null>(null);
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);

  // Read guest context from storage if present
  const [context] = useState<GuestUnderstandingContext | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('nebula_guest_claim');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          domain: parsed.domain || '',
          understandingType: 'Infrastructure Understanding',
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        };
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    // If an error code is present in query parameters, do not attempt auth verification loop
    if (initialError) {
      return;
    }

    const handleCallback = async () => {
      try {
        // Refetch user identity to hydrate current auth session established by backend callback cookie
        const authenticatedUser = await refetchUser();

        if (!authenticatedUser) {
          throw new Error('Failed to retrieve authenticated session profile.');
        }

        // Context-Aware flow: claim guest session if claim record is present
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem('nebula_guest_claim');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.sessionId || parsed.domain) {
                await checkAndClaimGuestSession();
                setClaimedDomain(parsed.domain || 'your domain');
              }
            } catch {
              // ignore
            }
          }
        }

        setStatus('success');

        // Automatic redirect to workspace after brief feedback pause
        setTimeout(() => {
          window.location.href = '/workspace';
        }, 1500);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Authentication verification failed. Please try signing in again.';
        setGenericErrorMessage(msg);
        setErrorCode('oauth_authentication_failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [initialError, refetchUser, checkAndClaimGuestSession]);

  const greetingName = getGreetingName(user?.fullName);
  const dark = theme === 'dark';
  const errorDetails = mapOAuthError(errorCode, emailParam);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />
      <NebulaAuthHeader />

      <main
        className="flex-1 flex items-start md:items-center justify-center pt-14"
        aria-label="OAuth Authentication Callback"
      >
        <div className="w-full max-w-[420px] mx-auto px-6 md:px-0 py-10 md:py-16 relative z-10">
          {/* Context Card (if claiming guest understanding) */}
          {context && status !== 'error' && (
            <UnderstandingContextCard context={context} step="verify" />
          )}

          {/* 1. Processing State */}
          {status === 'processing' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mx-auto bg-card/60">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <h1
                  className="font-serif text-[2.2rem] font-medium text-foreground leading-[1.1] tracking-tight"
                >
                  Completing your<br />
                  <em>sign in.</em>
                </h1>
                <p
                  className="font-mono text-xs text-muted-foreground pt-1"
                >
                  Establishing session and preserving workspace understanding...
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
                className="font-serif text-[2.3rem] md:text-[2.5rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
              >
                Authenticated.<br />
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
                  ' Entering your workspace...'
                )}
              </p>

              <a
                href="/workspace"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm"
              >
                <span>Enter Nebula Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* 3. Error State (Production-Grade Error Boundary Experience) */}
          {status === 'error' && (
            <div className="flex flex-col gap-0 animate-in fade-in duration-300">
              {/* Distinct Badge/Icon */}
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-8 ${
                  errorDetails.iconType === 'account_deactivated'
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : errorDetails.iconType === 'unverified_email'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : errorDetails.iconType === 'denied'
                        ? 'border-muted-foreground/30 bg-muted/40 text-muted-foreground'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                {errorDetails.iconType === 'account_deactivated' && (
                  <ShieldAlert className="w-6 h-6" />
                )}
                {errorDetails.iconType === 'unverified_email' && (
                  <Mail className="w-6 h-6" />
                )}
                {errorDetails.iconType === 'denied' && (
                  <ShieldAlert className="w-6 h-6" />
                )}
                {errorDetails.iconType === 'error' && (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>

              {/* Editorial Heading */}
              <h1
                className="font-serif text-[2.2rem] md:text-[2.5rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
              >
                {errorDetails.title.split(' ').slice(0, -1).join(' ')}<br />
                <em>{errorDetails.title.split(' ').slice(-1)}</em>
              </h1>

              {/* Explanatory Body */}
              <p className="text-sm text-foreground/80 leading-relaxed mb-2 font-sans">
                {errorDetails.body}
              </p>

              {/* Supporting Instruction */}
              {errorDetails.instruction && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-8">
                  {errorDetails.instruction}
                </p>
              )}

              {/* Generic fallback detail if available */}
              {genericErrorMessage && !initialError && (
                <div
                  role="alert"
                  className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed"
                >
                  {genericErrorMessage}
                </div>
              )}

              {/* Primary & Secondary Actions */}
              <div className="flex flex-col gap-3 pt-2">
                {errorDetails.primaryAction && (
                  <a
                    href={errorDetails.primaryAction.href}
                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3.5 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shadow-sm text-center"
                  >
                    <span>{errorDetails.primaryAction.label}</span>
                    {errorDetails.primaryAction.actionType === 'retry_github' ||
                    errorDetails.primaryAction.actionType === 'retry_login' ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </a>
                )}

                {errorDetails.secondaryAction && (
                  <a
                    href={errorDetails.secondaryAction.href}
                    className="flex items-center justify-center gap-2 border border-border bg-card/60 hover:bg-muted/40 text-foreground rounded-lg px-6 py-3 text-xs font-medium transition-colors text-center"
                  >
                    <span>{errorDetails.secondaryAction.label}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthCallbackPage;
