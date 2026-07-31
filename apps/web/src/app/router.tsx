import React from 'react';
import { LandingPage } from '../features/landing/LandingPage';

export const AppRouter: React.FC = () => {
  // Minimal deterministic router matching section strictness
  return <LandingPage />;
};
