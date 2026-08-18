import React, { useState, useEffect } from 'react';
import { LandingPage } from './features/landing';
import { GuestPage } from './features/guest';
import {
  AuthProvider,
  CreateWorkspacePage,
  LoginPage,
  VerifyEmailPage,
  AuthCallbackPage,
} from './features/auth';
import { WorkspacePage } from './features/workspace';

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

  if (pathname.startsWith('/auth/callback')) {
    return <AuthCallbackPage />;
  }

  if (
    pathname === '/create-workspace' ||
    pathname === '/auth/register' ||
    pathname === '/register'
  ) {
    return <CreateWorkspacePage />;
  }

  if (pathname === '/auth/login' || pathname === '/login') {
    return <LoginPage />;
  }

  if (pathname === '/auth/verify-email' || pathname === '/verify-email') {
    return <VerifyEmailPage />;
  }

  if (pathname.startsWith('/guest')) {
    return <GuestPage />;
  }

  if (pathname.startsWith('/workspace') || pathname.startsWith('/dashboard')) {
    return <WorkspacePage />;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
