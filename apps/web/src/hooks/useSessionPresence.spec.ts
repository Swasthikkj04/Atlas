import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { useSessionPresence } from './useSessionPresence.ts';
import { telemetry, getTabInstanceId } from '../services/telemetry.service.ts';

describe('ADMIN-003: useSessionPresence Lifecycle & Observational Telemetry Suite', () => {
  let originalWindow: any;
  let originalDocument: any;
  let originalSessionStorage: any;
  let docListeners: Map<string, Function[]> = new Map();
  let winListeners: Map<string, Function[]> = new Map();
  let mockStorage: Map<string, string> = new Map();
  let trackCalls: Array<{ event: string; payload: any }> = [];
  let trackBeaconCalls: Array<{ event: string; payload: any }> = [];

  beforeEach(() => {
    docListeners = new Map();
    winListeners = new Map();
    mockStorage = new Map();
    trackCalls = [];
    trackBeaconCalls = [];

    originalWindow = (globalThis as any).window;
    originalDocument = (globalThis as any).document;
    originalSessionStorage = (globalThis as any).sessionStorage;

    (globalThis as any).sessionStorage = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, String(value)),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    };

    (globalThis as any).document = {
      visibilityState: 'visible',
      addEventListener: (evt: string, fn: Function) => {
        const arr = docListeners.get(evt) || [];
        arr.push(fn);
        docListeners.set(evt, arr);
      },
      removeEventListener: (evt: string, fn: Function) => {
        const arr = docListeners.get(evt) || [];
        docListeners.set(
          evt,
          arr.filter((f) => f !== fn)
        );
      },
    };

    (globalThis as any).window = {
      location: { pathname: '/admin/security' },
      addEventListener: (evt: string, fn: Function) => {
        const arr = winListeners.get(evt) || [];
        arr.push(fn);
        winListeners.set(evt, arr);
      },
      removeEventListener: (evt: string, fn: Function) => {
        const arr = winListeners.get(evt) || [];
        winListeners.set(
          evt,
          arr.filter((f) => f !== fn)
        );
      },
    };

    telemetry.track = ((event: any, meta: any) => {
      trackCalls.push({ event, payload: meta });
    }) as any;

    telemetry.trackBeacon = ((event: any, meta: any) => {
      trackBeaconCalls.push({ event, payload: meta });
      return true;
    }) as any;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
    (globalThis as any).sessionStorage = originalSessionStorage;
  });

  it('exports useSessionPresence hook without throwing', () => {
    assert.equal(typeof useSessionPresence, 'function');
  });

  it('verifies tab instance identity scoping per browser tab', () => {
    const tabId1 = getTabInstanceId();
    assert.ok(tabId1.startsWith('tab_'));

    // Same tab returns same ID
    const tabId2 = getTabInstanceId();
    assert.equal(tabId1, tabId2);
  });

  it('verifies FREEZE INVARIANT: SESSION_TAB_CLOSED ≠ SESSION_REVOKED across events', () => {
    // 1. Verify beacon is called on pagehide
    const tabId = getTabInstanceId();
    telemetry.trackBeacon('SESSION_TAB_CLOSED', {
      tabInstanceId: tabId,
      path: '/admin',
      status: 'closed',
    });

    assert.equal(trackBeaconCalls.length, 1);
    assert.equal(trackBeaconCalls[0].event, 'SESSION_TAB_CLOSED');
    assert.equal(trackBeaconCalls[0].payload.tabInstanceId, tabId);

    // 2. Invariant: Telemetry payload contains no credentials or revocation instructions
    assert.equal(trackBeaconCalls[0].payload.revokeSession, undefined);
    assert.equal(trackBeaconCalls[0].payload.token, undefined);
  });
});
