import React, { useState, useEffect } from 'react';
import { LandingPage } from './features/landing';
import { GuestPage } from './features/guest';
import { AuthCallbackPage } from './features/auth/AuthCallbackPage';

export const App: React.FC = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname.startsWith('/auth/callback')) {
    return <AuthCallbackPage />;
  }

  if (pathname.startsWith('/guest')) {
    return <GuestPage />;
  }

  return <LandingPage />;
};

export default App;
