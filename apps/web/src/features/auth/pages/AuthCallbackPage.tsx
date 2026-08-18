import React, { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import {
  UnderstandingContextCard,
  type GuestUnderstandingContext,
} from '../components/UnderstandingContextCard';
import { getGreetingName } from '../utils/name.util';

const SERIF = "'Lora', 'Newsreader', Georgia, serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

export const AuthCallbackPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, refetchUser, checkAndClaimGuestSession } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);

  // Read guest context from storage if present
  const [context] = useState<GuestUnderstandingContext | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('nebula_guest_claim');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.domain) {
            return {
              domain: parsed.domain,
              understandingType: 'Infrastructure Understanding',
              expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
            };
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        // 1. Refetch current profile to verify session established by OAuth cookie
        const resolvedUser = await refetchUser();
        if (!resolvedUser) {
          throw new Error('Failed to resolve authenticated session from OAuth provider.');
        }

        // 2. Claim guest understanding if a pending session is held in storage
        try {
          const claimResult = await checkAndClaimGuestSession();
          if (claimResult?.domainName && isMounted) {
            setClaimedDomain(claimResult.domainName);
          }
        } catch (claimErr) {
          console.error('Non-blocking guest session claim error:', claimErr);
        }

        if (isMounted) {
          setStatus('success');
          const timer = setTimeout(() => {
            if (isMounted) {
              window.location.href = '/workspace';
            }
          }, 1400);
          return () => clearTimeout(timer);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus('error');
          const msg =
            err instanceof Error
              ? err.message
              : 'OAuth authentication failed. Please try signing in again.';
          setErrorMessage(msg);
        }
      }
    }

    void handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [refetchUser, checkAndClaimGuestSession]);

  const greetingName = getGreetingName(user?.fullName);
  const dark = theme === 'dark';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />
      <NebulaAuthHeader />

      <main
        className="flex-1 flex items-start md:items-center justify-center pt-14"
        aria-label="OAuth Authentication Callback"
      >
        <div className="w-full max-w-[420px] mx-auto px-6 md:px-0 py-10 md:py-16 relative z-10">
          {context && (
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
                  style={{ fontFamily: SERIF }}
                  className="text-[2.2rem] font-medium text-foreground leading-[1.1] tracking-tight"
                >
                  Completing your<br />
                  <em>sign in.</em>
                </h1>
                <p
                  style={{ fontFamily: MONO }}
                  className="text-xs text-muted-foreground pt-1"
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
                style={{ fontFamily: SERIF }}
                className="text-[2.3rem] md:text-[2.5rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
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

          {/* 3. Error State */}
          {status === 'error' && (
            <div className="flex flex-col gap-5">
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Authentication Failed</p>
                  <p>{errorMessage}</p>
                </div>
              </div>

              <div className="text-center pt-2">
                <a
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Return to Sign In
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthCallbackPage;
