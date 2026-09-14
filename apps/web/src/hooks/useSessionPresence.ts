import { useEffect } from 'react';
import { telemetry, getTabInstanceId } from '../services/telemetry.service.ts';

/**
 * ADMIN-003: Browser Tab Presence & Session Lifecycle Telemetry
 *
 * Centralized session-presence lifecycle hook.
 * Captures lightweight tab presence transitions (open, visible, hidden, closed)
 * with dedicated tabInstanceId scoping.
 *
 * 🔒 FREEZE INVARIANT:
 * SESSION_TAB_CLOSED ≠ SESSION_REVOKED
 *
 * Browser presence is observational telemetry.
 * Session revocation is authoritative security state.
 * Closing a tab or navigating away reports SESSION_TAB_CLOSED, but NEVER
 * revokes or invalidates the underlying authenticated session.
 */
export function useSessionPresence(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tabInstanceId = getTabInstanceId();
    const currentPath = window.location.pathname;
    const initialVisibility = typeof document !== 'undefined' ? document.visibilityState : 'visible';

    // 1. Dispatch tab opened signal on mount
    telemetry.track('SESSION_TAB_OPENED', {
      tabInstanceId,
      path: currentPath,
      status: initialVisibility,
    });

    // 2. Handle document visibility changes (active vs background/hidden tab)
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      const path = window.location.pathname;

      if (document.visibilityState === 'visible') {
        telemetry.track('SESSION_TAB_VISIBLE', {
          tabInstanceId,
          path,
          status: 'visible',
        });
      } else if (document.visibilityState === 'hidden') {
        telemetry.track('SESSION_TAB_HIDDEN', {
          tabInstanceId,
          path,
          status: 'hidden',
        });
      }
    };

    // 3. Handle pagehide / document unload (best-effort beacon transport)
    const handlePageHide = () => {
      const path = window.location.pathname;
      // Use keepalive beacon for reliable transmission during page termination
      telemetry.trackBeacon('SESSION_TAB_CLOSED', {
        tabInstanceId,
        path,
        status: 'closed',
      });
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, []);
}
