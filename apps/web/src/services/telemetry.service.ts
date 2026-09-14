/**
 * ADMIN-002: Centralized Telemetry Client & Action Beacons
 *
 * Observational product telemetry client with strict privacy boundary,
 * client-side sanitization, render deduplication, and non-blocking transport.
 *
 * Invariant: "Telemetry can fail. Nebula cannot."
 */

export type TelemetryEvent =
  | 'SCAN_DOMAIN_CTA'
  | 'SIGN_UP_CTA'
  | 'SCAN_DOMAIN'
  | 'CLAIM_SESSION'
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'AUTH_FAILURE'
  | 'PAGE_VIEW'
  | 'EXPLORE_DOCS_CTA'
  | 'NAVIGATE'
  // ADMIN-003: Browser Tab Presence & Session Lifecycle Telemetry
  // FREEZE INVARIANT: SESSION_TAB_CLOSED ≠ SESSION_REVOKED
  // Browser presence is observational telemetry. Session revocation is authoritative security state.
  | 'SESSION_TAB_OPENED'
  | 'SESSION_TAB_VISIBLE'
  | 'SESSION_TAB_HIDDEN'
  | 'SESSION_TAB_CLOSED';

export interface TelemetryMetadata {
  submittedDomain?: string;
  ctaLocation?: string;
  referrer?: string;
  section?: string;
  errorCode?: string;
  provider?: string;
  status?: string;
  surface?: string;
  path?: string;
  tabInstanceId?: string;
}

export interface TelemetryPayload {
  event: TelemetryEvent;
  timestamp?: string;
  sessionId?: string;
  path?: string;
  surface?: string;
  metadata?: TelemetryMetadata;
}

const TAB_INSTANCE_STORAGE_KEY = 'nebula_tab_instance_id';

/**
 * ADMIN-003: Tab Instance Identity
 * Generates a non-sensitive, randomly generated tab instance identifier,
 * scoped to the lifetime of the browser tab via sessionStorage.
 * Never uses JWT or authentication credentials as tab identifier.
 */
export function getTabInstanceId(): string {
  try {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return 'tab_ssr_00000000';
    }

    let tabId = sessionStorage.getItem(TAB_INSTANCE_STORAGE_KEY);
    if (!tabId || tabId.trim() === '') {
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timestampPart = Date.now().toString(36);
      tabId = `tab_${timestampPart}_${randomPart}`;
      sessionStorage.setItem(TAB_INSTANCE_STORAGE_KEY, tabId);
    }
    return tabId;
  } catch {
    return `tab_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }
}

const FORBIDDEN_KEYS = [
  'password',
  'pass',
  'pwd',
  'token',
  'secret',
  'key',
  'cookie',
  'cookies',
  'sessiontoken',
  'accesstoken',
  'refreshtoken',
  'auth',
  'authorization',
  'credential',
  'credentials',
  'clientsecret',
  'privatekey',
  'hash',
  'bearer',
];

/**
 * Sanitizes and normalizes submitted domain according to privacy rules.
 * Strips protocol, port, path, and query strings.
 */
export function normalizeTelemetryDomain(rawDomain?: string): string | undefined {
  if (!rawDomain || typeof rawDomain !== 'string') {
    return undefined;
  }

  let clean = rawDomain.trim().toLowerCase();
  clean = clean.replace(/^(?:https?:\/\/|wss?:\/\/|ftp:\/\/)/i, '');
  clean = clean.split('/')[0].split('?')[0].split('#')[0];
  clean = clean.split(':')[0];
  if (clean.includes('@')) {
    clean = clean.split('@').pop() || '';
  }
  clean = clean.replace(/^\.+|\.+$/g, '');

  if (clean.length === 0 || clean.length > 253) {
    return undefined;
  }

  // Allow localhost / local for dev/test
  if (clean === 'localhost' || clean.endsWith('.local') || clean.endsWith('.internal')) {
    return clean;
  }

  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
  return domainRegex.test(clean) ? clean : undefined;
}

/**
 * Strips forbidden sensitive keys and normalizes allowed metadata.
 */
export function sanitizeTelemetryMetadata(
  meta?: Record<string, any>,
): TelemetryMetadata | undefined {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const clean: TelemetryMetadata = {};

  for (const [key, value] of Object.entries(meta)) {
    const normKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (FORBIDDEN_KEYS.some((forbidden) => normKey.includes(forbidden))) {
      continue; // Drop sensitive fields silently
    }

    if (typeof value === 'string') {
      const truncated = value.slice(0, 500);
      if (key === 'submittedDomain' || key === 'domain') {
        const norm = normalizeTelemetryDomain(truncated);
        if (norm) clean.submittedDomain = norm;
      } else if (key === 'ctaLocation') {
        clean.ctaLocation = truncated;
      } else if (key === 'referrer') {
        clean.referrer = truncated;
      } else if (key === 'section') {
        clean.section = truncated;
      } else if (key === 'errorCode') {
        clean.errorCode = truncated;
      } else if (key === 'provider') {
        clean.provider = truncated;
      } else if (key === 'status') {
        clean.status = truncated;
      } else if (key === 'surface') {
        clean.surface = truncated;
      } else if (key === 'path') {
        clean.path = truncated;
      } else if (key === 'tabInstanceId') {
        clean.tabInstanceId = truncated.slice(0, 64);
      }
    }
  }

  return Object.keys(clean).length > 0 ? clean : undefined;
}

class TelemetryClient {
  private recentEvents = new Map<string, number>();
  private readonly DEDUPE_WINDOW_MS = 300;

  /**
   * Dispatches an observational telemetry action beacon.
   * Guaranteed non-blocking and fail-safe.
   */
  public track(event: TelemetryEvent, metadata?: TelemetryMetadata): void {
    try {
      if (typeof window === 'undefined') return;

      // Deduplication guard against rapid React double renders
      const dedupeKey = `${event}:${metadata?.path || window.location.pathname}:${metadata?.ctaLocation || ''}:${metadata?.submittedDomain || ''}`;
      const now = Date.now();
      const lastFired = this.recentEvents.get(dedupeKey);
      if (lastFired && now - lastFired < this.DEDUPE_WINDOW_MS) {
        return; // Deduplicate
      }
      this.recentEvents.set(dedupeKey, now);

      // Clean old dedupe entries
      if (this.recentEvents.size > 100) {
        for (const [k, ts] of this.recentEvents.entries()) {
          if (now - ts > 10000) {
            this.recentEvents.delete(k);
          }
        }
      }

      const sanitizedMeta = sanitizeTelemetryMetadata(metadata);
      const payload: TelemetryPayload = {
        event,
        timestamp: new Date().toISOString(),
        path: metadata?.path || window.location.pathname,
        surface: metadata?.surface || this.resolveSurface(window.location.pathname),
        metadata: sanitizedMeta,
      };

      // Non-blocking fetch dispatch with keepalive
      void fetch('/api/v1/telemetry/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Silently swallow network / telemetry transport errors
      });
    } catch {
      // Invariant: Telemetry failure must never crash or affect product
    }
  }

  /**
   * Uses navigator.sendBeacon for navigation or page unload events.
   */
  public trackBeacon(event: TelemetryEvent, metadata?: TelemetryMetadata): boolean {
    try {
      if (typeof window === 'undefined') return false;

      const sanitizedMeta = sanitizeTelemetryMetadata(metadata);
      const payload: TelemetryPayload = {
        event,
        timestamp: new Date().toISOString(),
        path: metadata?.path || window.location.pathname,
        surface: metadata?.surface || this.resolveSurface(window.location.pathname),
        metadata: sanitizedMeta,
      };

      const payloadString = JSON.stringify(payload);

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payloadString], { type: 'application/json' });
        return navigator.sendBeacon('/api/v1/telemetry/events', blob);
      } else {
        void fetch('/api/v1/telemetry/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadString,
          keepalive: true,
        }).catch(() => {});
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Helper to resolve platform surface from pathname.
   */
  public resolveSurface(path: string): string {
    if (!path || path === '/' || path === '') return 'landing';
    if (path.startsWith('/guest')) return 'gx';
    if (path.startsWith('/docs')) return 'docs';
    if (path.startsWith('/workspace') || path.startsWith('/dashboard')) return 'workspace';
    if (path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register')) return 'auth';
    if (path.startsWith('/admin')) return 'admin';
    return 'other';
  }
}

export const telemetry = new TelemetryClient();
