import React, { type ReactNode } from 'react';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    // Wrap future TanStack Query / Auth providers here
    <>{children}</>
  );
};
