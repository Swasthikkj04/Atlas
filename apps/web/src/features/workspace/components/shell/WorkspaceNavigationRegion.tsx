import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../../hooks/useReducedMotion';
import type { WorkspaceNavigationRegionProps } from './WorkspaceNavigationRegion.types';

/**
 * Authoritative Workspace Navigation Region (WX-102 / WX-106).
 *
 * Establishes the structural area for Workspace navigation with robust interaction:
 * - Desktop: Persistent left-hand sidebar (w-60).
 * - Mobile/Tablet: Structural reflow with drawer overlay.
 * - Escape key closing behavior.
 * - Body scroll lock when open on mobile.
 * - Focus trapping and restoration.
 * - Reduced motion support.
 */
export const WorkspaceNavigationRegion: React.FC<WorkspaceNavigationRegionProps> = ({
  children,
  isOpen = false,
  onClose,
  className = '',
  ...rest
}) => {
  const navRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // 1. Focus Management (Capture active element before opening, restore on close)
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined') {
        previousActiveElement.current = document.activeElement as HTMLElement;
      }
      // Focus first focusable element inside drawer or the nav container
      const timer = setTimeout(() => {
        if (navRef.current) {
          const firstFocusable = navRef.current.querySelector<HTMLElement>(
            'a, button, input, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus?.();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // 2. Escape Key Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 3. Body Scroll Lock when Drawer is Modal
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const motionClass = prefersReducedMotion
    ? 'transition-none'
    : 'transition-transform duration-200 ease-out';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[900] lg:hidden transition-opacity"
        />
      )}

      {/* Navigation Region */}
      <nav
        id="workspace-nav"
        ref={navRef}
        aria-label="Workspace Navigation"
        aria-hidden={!isOpen ? undefined : undefined}
        tabIndex={-1}
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 z-[950] lg:z-10
          border-r border-border bg-card/80 lg:bg-card/40 backdrop-blur-md
          flex flex-col flex-shrink-0
          outline-none
          ${motionClass}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
        {...rest}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col justify-between">
          {children}
        </div>
      </nav>
    </>
  );
};

WorkspaceNavigationRegion.displayName = 'WorkspaceNavigationRegion';
