import React, { useState, useEffect } from 'react';
import { LandingPage } from './features/landing';
import { GuestPage } from './features/guest';
import {
  AuthProvider,
  CreateWorkspacePage,
  LoginPage,
  VerifyEmailPage,
  AuthCallbackPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './features/auth';
import { WorkspacePage } from './features/workspace';
import { resolveAppRoute } from './routes/routes';

const AppRoutes: React.FC = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      // Handle internal relative paths
      if (href && href.startsWith('/') && !href.startsWith('//') && !anchor.hasAttribute('download')) {
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

  const route = resolveAppRoute(pathname);

  switch (route) {
    case 'AUTH_CALLBACK':
      return <AuthCallbackPage />;
    case 'CREATE_WORKSPACE':
      return <CreateWorkspacePage />;
    case 'FORGOT_PASSWORD':
      return <ForgotPasswordPage />;
    case 'RESET_PASSWORD':
      return <ResetPasswordPage />;
    case 'LOGIN':
      return <LoginPage />;
    case 'VERIFY_EMAIL':
      return <VerifyEmailPage />;
    case 'GUEST':
      return <GuestPage />;
    case 'WORKSPACE':
      return <WorkspacePage />;
    case 'LANDING':
    default:
      return <LandingPage />;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
