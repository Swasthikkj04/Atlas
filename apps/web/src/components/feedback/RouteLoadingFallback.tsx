import React from 'react';
import { BackgroundConstellation } from '../branding';
import { LoadingState } from '../states';

/**
 * RouteLoadingFallback — Calm, accessible full-screen loading fallback for route Suspense boundaries.
 *
 * Adheres to WX-000 visual design tokens and reduced-motion standards.
 */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden selection:bg-primary/20 selection:text-foreground"
    >
      <BackgroundConstellation opacity={0.04} className="fixed inset-0 z-0 pointer-events-none" />
      <div className="relative z-10 p-6">
        <LoadingState
          label="Preparing interface..."
          size="md"
          centered
        />
      </div>
    </div>
  );
};

RouteLoadingFallback.displayName = 'RouteLoadingFallback';

export default RouteLoadingFallback;
