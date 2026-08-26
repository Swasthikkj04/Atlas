import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Icon } from '../../../../components/icons';

export interface ReturnToPresentButtonProps {
  readonly scrollThreshold?: number;
  readonly onReturnToPresent?: () => void;
  readonly className?: string;
}

/**
 * Return to Present Telemetry Button (WX-1026).
 *
 * Floating button offering smooth navigation back to the present epoch:
 * - Appears only when scrolled materially into historical records
 * - Visually restrained without resembling generic back-to-top buttons
 * - Respects reduced motion preferences
 */
export const ReturnToPresentButton: React.FC<ReturnToPresentButtonProps> = ({
  scrollThreshold = 400,
  onReturnToPresent,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(currentScroll > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  const handleClick = () => {
    if (onReturnToPresent) {
      onReturnToPresent();
    } else {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200 ${className}`}
      data-testid="return-to-present-container"
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Return to latest verified state"
        className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card text-xs font-mono font-medium text-foreground hover:bg-[#FAFAF8] dark:hover:bg-surface-elevated hover:border-[#DCDCD7] shadow-[0_4px_16px_rgba(16,24,20,0.08)] transition-all cursor-pointer select-none focus-ring"
        data-testid="return-to-present-button"
      >
        <Icon icon={ArrowUp} size="small" className="text-[#3568C8]" />
        <span>Return to present</span>
      </button>
    </div>
  );
};

ReturnToPresentButton.displayName = 'ReturnToPresentButton';
