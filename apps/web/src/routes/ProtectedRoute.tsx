import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackUrl?: string;
  loadingMessage?: string;
}

/**
 * Protected Route Architecture Foundation.
 *
 * Guarantees that unauthenticated sessions cannot render protected Workspace surfaces.
 * Preserves the user's intended target route for post-login redirection.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackUrl = '/login',
  loadingMessage = 'Opening Nebula Workspace...',
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      const redirectParam =
        currentPath && currentPath !== '/' && currentPath !== '/workspace'
          ? `?redirect=${encodeURIComponent(currentPath)}`
          : '';
      window.location.href = `${fallbackUrl}${redirectParam}`;
    }
  }, [isLoading, isAuthenticated, fallbackUrl]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-xl border border-border bg-card/60 flex items-center justify-center shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-serif text-xl font-medium text-foreground">
              {loadingMessage}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Verifying authenticated session credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

ProtectedRoute.displayName = 'ProtectedRoute';
