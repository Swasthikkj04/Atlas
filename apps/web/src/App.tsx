import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from './features/auth/context/AuthContext';
import { telemetry } from './services';
import { resolveAppRoute, ProtectedRoute } from './routes';
import { SkipToContent } from './components/accessibility';
import { ErrorBoundary, RouteLoadingFallback } from './components/feedback';
import { useSessionPresence } from './hooks';

// TKT-001: Route-level Dynamic Imports & Code Splitting
const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const GuestPage = lazy(() => import('./features/guest/pages/GuestPage'));
const CreateWorkspacePage = lazy(() => import('./features/auth/pages/CreateWorkspacePage'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const VerifyEmailPage = lazy(() => import('./features/auth/pages/VerifyEmailPage'));
const AuthCallbackPage = lazy(() => import('./features/auth/pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'));
const ReactivateAccountPage = lazy(() => import('./features/auth/pages/ReactivateAccountPage'));
const WorkspacePage = lazy(() => import('./features/workspace/WorkspacePage'));
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage'));
const AdminPage = lazy(() => import('./features/admin/AdminPage'));
const PrivacyPolicyPage = lazy(() => import('./features/legal/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./features/legal/TermsPage'));
const DocsPage = lazy(() => import('./features/docs/DocsPage'));

export const AppRoutes: React.FC = () => {
  // ADMIN-003: Observational browser tab presence & session lifecycle
  useSessionPresence();

  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      // Handle internal relative paths
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !anchor.hasAttribute('download')
      ) {
        if (href.startsWith('/api/')) return;

        e.preventDefault();
        if (href !== window.location.pathname + window.location.search) {
          window.history.pushState({}, '', href);
          setPathname(window.location.pathname);
          window.scrollTo(0, 0);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  useEffect(() => {
    // Record client visitor telemetry beacon quietly in background
    if (typeof window !== 'undefined' && !pathname.startsWith('/admin')) {
      telemetry.track('PAGE_VIEW', {
        path: pathname,
        referrer: document.referrer || undefined,
      });
    }
  }, [pathname]);

  const route = resolveAppRoute(pathname);

  const renderRoute = () => {
    switch (route) {
      case 'AUTH_CALLBACK':
        return <AuthCallbackPage />;
      case 'CREATE_WORKSPACE':
        return <CreateWorkspacePage />;
      case 'FORGOT_PASSWORD':
        return <ForgotPasswordPage />;
      case 'RESET_PASSWORD':
        return <ResetPasswordPage />;
      case 'REACTIVATE':
        return <ReactivateAccountPage />;
      case 'LOGIN':
        return <LoginPage />;
      case 'VERIFY_EMAIL':
        return <VerifyEmailPage />;
      case 'GUEST':
        return <GuestPage />;
      case 'WORKSPACE':
        return (
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        );
      case 'SETTINGS':
        return (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        );
      case 'ADMIN':
        return <AdminPage />;
      case 'PRIVACY':
        return <PrivacyPolicyPage />;
      case 'TERMS':
        return <TermsPage />;
      case 'DOCS':
        return <DocsPage />;
      case 'LANDING':
      default:
        return <LandingPage />;
    }
  };

  return (
    <ErrorBoundary resetKeys={[pathname]}>
      <Suspense fallback={<RouteLoadingFallback />}>
        {renderRoute()}
      </Suspense>
    </ErrorBoundary>
  );
};

export const App: React.FC = () => {
  return (
    <>
      <SkipToContent />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </>
  );
};

export default App;

