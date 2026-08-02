import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { EASE_CSS, ANIMATION_DURATIONS } from '../../utils/constants';

export interface FadeUpProps {
  children: React.ReactNode;
  delay?: number; // in seconds
  className?: string;
  reduced?: boolean;
}

export const FadeUp: React.FC<FadeUpProps> = ({
  children,
  delay = 0,
  className = '',
  reduced: forcedReduced,
}) => {
  const isReduced = useReducedMotion();
  const shouldReduce = forcedReduced ?? isReduced;

  const [mounted, setMounted] = React.useState<boolean>(() => shouldReduce);

  React.useEffect(() => {
    if (shouldReduce) return;
    const timer = setTimeout(() => {
      setMounted(true);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [delay, shouldReduce]);

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(22px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: `${ANIMATION_DURATIONS.fadeUp}ms`,
        transitionTimingFunction: EASE_CSS,
      }}
    >
      {children}
    </div>
  );
};
