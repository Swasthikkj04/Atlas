import React from 'react';
import { LandingPage } from './features/landing';
import { AuthCallbackPage } from './features/auth/AuthCallbackPage';

export const App: React.FC = () => {
  const isAuthCallback = window.location.pathname.startsWith('/auth/callback');

  if (isAuthCallback) {
    return <AuthCallbackPage />;
  }

  return <LandingPage />;
};

export default App;
