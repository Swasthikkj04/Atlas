import React from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import type { SkeletonProps } from './Skeleton.types';

/**
 * Authoritative Skeleton Primitive.
 *
 * Provides spatial layout continuity during background data fetches.
 * Avoids busy fake visual clutter and respects reduced motion settings.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  className = '',
  style,
  ...rest
}) => {
  const reducedMotion = useReducedMotion();
  const pulseClass = reducedMotion ? 'opacity-40' : 'animate-pulse';

  const customStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 w-full ${className}`} {...rest}>
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`h-3.5 bg-muted/60 rounded ${pulseClass} ${
              idx === lines - 1 ? 'w-4/5' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  const variantClass =
    variant === 'text'
      ? 'h-3.5 w-full rounded'
      : variant === 'circular'
      ? 'rounded-full'
      : variant === 'card'
      ? 'rounded-xl border border-border bg-card/40 min-h-[120px] w-full p-4'
      : 'rounded-lg';

  return (
    <div
      aria-hidden="true"
      className={`bg-muted/60 ${variantClass} ${pulseClass} ${className}`}
      style={customStyle}
      {...rest}
    />
  );
};

Skeleton.displayName = 'Skeleton';
