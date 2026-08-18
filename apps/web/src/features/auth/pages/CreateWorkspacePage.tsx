import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../guest/hooks/useTheme';
import { NetworkBg } from '../components/NetworkBg';
import { NebulaAuthHeader } from '../components/NebulaAuthHeader';
import {
  UnderstandingContextCard,
  type GuestUnderstandingContext,
} from '../components/UnderstandingContextCard';
import { RegistrationForm } from '../components/RegistrationForm';
import { CheckEmailView } from '../components/CheckEmailView';

export type CreateWorkspaceMode = 'context-aware' | 'direct';

export interface CreateWorkspacePageProps {
  mode?: CreateWorkspaceMode;
}

type Step = 'register' | 'check-email';

export const CreateWorkspacePage: React.FC<CreateWorkspacePageProps> = ({ mode: propMode }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>('register');
  const [sentEmail, setSentEmail] = useState('');

  // 1. Determine Mode: Context-Aware (Mode A) vs. Direct (Mode B)
  const isContextAware = useMemo(() => {
    if (propMode === 'context-aware') return true;
    if (propMode === 'direct') return false;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'direct') return false;
      if (params.get('mode') === 'guest' || params.get('mode') === 'context-aware') return true;
      const sessionParam = params.get('session');
      const domainParam = params.get('domain');
      if (sessionParam || domainParam) return true;
    }
    return false;
  }, [propMode]);

  // 2. Extract Guest Context only in Context-Aware Mode (Never in Direct Mode)
  const [context] = useState<GuestUnderstandingContext | null>(() => {
    if (!isContextAware || typeof window === 'undefined') {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain') || '';
    let expiresAt: Date | null = null;

    try {
      const raw = sessionStorage.getItem('nebula_guest_claim');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiresAt) expiresAt = new Date(parsed.expiresAt);
      }
    } catch {
      // ignore
    }

    return {
      domain: domain || 'your infrastructure',
      understandingType: 'Infrastructure Understanding',
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  });

  // 3. Persist Guest Session into storage ONLY in Context-Aware Mode
  useEffect(() => {
    if (!isContextAware || typeof window === 'undefined') return;
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
            expiresAt: context?.expiresAt?.toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }
  }, [isContextAware, context?.expiresAt]);

  const searchParams = isContextAware && typeof window !== 'undefined' ? window.location.search : '';

  const handleInitiateOAuth = (provider: 'google' | 'github') => {
    if (typeof window === 'undefined') return;

    if (isContextAware) {
      // Preserve guest context in sessionStorage across external OAuth redirect
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const domainParam = params.get('domain');

      if (sessionParam || domainParam || (context?.domain && context.domain !== 'your infrastructure')) {
        try {
          sessionStorage.setItem(
            'nebula_guest_claim',
            JSON.stringify({
              sessionId: sessionParam || '',
              domain: domainParam || (context?.domain !== 'your infrastructure' ? context?.domain : ''),
              expiresAt: context?.expiresAt ? new Date(context.expiresAt).toISOString() : null,
            })
          );
        } catch {
          // ignore
        }
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
          {/* Context Card (Mode A only) */}
          {isContextAware && context && (
            <UnderstandingContextCard context={context} step={step} />
          )}

          {/* Step 1: Register */}
          {step === 'register' && (
            <>
              <div className="mb-8">
                {isContextAware ? (
                  <>
                    <h1
                      className="font-serif text-[2.5rem] md:text-[2.75rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
                    >
                      Your understanding<br />
                      <em>is ready to preserve.</em>
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
                      Create an account to claim this understanding before it expires.
                    </p>
                  </>
                ) : (
                  <>
                    <h1
                      className="font-serif text-[2.5rem] md:text-[2.75rem] font-medium text-foreground leading-[1.1] tracking-tight mb-3"
                    >
                      Create your workspace.
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px]">
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
                loginHref={`/login${searchParams}`}
              />
            </>
          )}

          {/* Step 2: Check Email */}
          {step === 'check-email' && (
            <CheckEmailView
              email={sentEmail}
              isContextAware={isContextAware}
              onEditEmail={() => setStep('register')}
            />
          )}
        </div>
      </main>
    </div>
  );
};

CreateWorkspacePage.displayName = 'CreateWorkspacePage';
export default CreateWorkspacePage;
