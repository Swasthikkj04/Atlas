import React from 'react';

export interface SkipToContentProps {
  targetId?: string;
  label?: string;
  className?: string;
}

/**
 * Accessible Skip to Main Content Link.
 *
 * Allows keyboard and screen reader users to bypass repetitive navigation
 * directly to the primary operating surface.
 */
export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content',
  className = '',
}) => {
  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1200] focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:text-xs focus:font-medium focus:rounded-lg focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-primary transition-all ${className}`}
    >
      {label}
    </a>
  );
};

SkipToContent.displayName = 'SkipToContent';
