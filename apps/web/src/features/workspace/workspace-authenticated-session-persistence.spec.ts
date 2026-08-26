import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_RENEWAL_INVARIANTS,
  resolveSessionRenewalState,
  isAuthEndpointExempt,
  createPreservedRedirectUrl,
  SingleFlightCoordinator,
} from '../auth/contracts/session-renewal.contract.ts';
import { ApiClient, AuthenticationError } from '../../lib/api-client.ts';

describe('WX-1013: Persistent Authenticated Session & Silent Session Renewal', () => {
  describe('1. Single-Flight Refresh Coordinator & Concurrent Request Protection', () => {
    it('batches 5 simultaneous expired requests into exactly 1 refresh operation', async () => {
      const coordinator = new SingleFlightCoordinator<boolean>();
      let backendRefreshCalls = 0;

      const performBackendRefresh = async (): Promise<boolean> => {
        backendRefreshCalls++;
        await new Promise((resolve) => setTimeout(resolve, 20)); // Simulated network latency
        return true;
      };

      // 5 concurrent requests encounter 401 simultaneously
      const results = await Promise.all([
        coordinator.run(performBackendRefresh),
        coordinator.run(performBackendRefresh),
        coordinator.run(performBackendRefresh),
        coordinator.run(performBackendRefresh),
        coordinator.run(performBackendRefresh),
      ]);

      assert.equal(backendRefreshCalls, 1, 'Exactly ONE refresh operation must occur for concurrent 401s');
      assert.deepEqual(results, [true, true, true, true, true], 'All 5 requests must receive successful renewal result');
      assert.equal(coordinator.totalFlightsExecuted, 1);
      assert.equal(coordinator.isFlightActive, false, 'Flight mutex resets after completion');
    });

    it('subsequent request after flight completion initiates a new single flight', async () => {
      const coordinator = new SingleFlightCoordinator<boolean>();
      let backendRefreshCalls = 0;

      const performBackendRefresh = async () => {
        backendRefreshCalls++;
        return true;
      };

      // First flight
      await coordinator.run(performBackendRefresh);
      assert.equal(backendRefreshCalls, 1);

      // Second flight (later in time)
      await coordinator.run(performBackendRefresh);
      assert.equal(backendRefreshCalls, 2);
    });
  });

  describe('2. ApiClient Silent Refresh & Retry Flow', () => {
    it('silently renews session and retries original request when access token is expired', async () => {
      let callCount = 0;
      let refreshCount = 0;

      // Mock global fetch to simulate:
      // Request 1 -> 401 (expired access token)
      // Refresh -> 200 OK
      // Retry Request -> 200 OK with payload
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        const urlStr = String(url);

        if (urlStr.includes('/auth/refresh')) {
          refreshCount++;
          return new Response(JSON.stringify({ accessToken: 'new_token', refreshToken: 'new_refresh' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (urlStr.includes('/domains')) {
          callCount++;
          if (callCount === 1) {
            return new Response(JSON.stringify({ message: 'Token expired', code: 'AUTH_EXPIRED' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify([{ id: 'dom-1', domainName: 'nebula.infra' }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response('Not Found', { status: 404 });
      };

      try {
        const client = new ApiClient({ baseUrl: 'http://localhost:3000' });
        const data = await client.get<any[]>('/domains');

        assert.equal(refreshCount, 1, 'Silent refresh must execute once');
        assert.equal(callCount, 2, 'Original request must be retried once');
        assert.equal(data.length, 1);
        assert.equal(data[0].domainName, 'nebula.infra');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('propagates AuthenticationError and invokes onSessionExpired when refresh session is invalid/revoked', async () => {
      let sessionExpiredNotified = false;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        const urlStr = String(url);

        if (urlStr.includes('/auth/refresh')) {
          return new Response(JSON.stringify({ message: 'Session revoked' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ message: 'Token expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      try {
        const client = new ApiClient({
          baseUrl: 'http://localhost:3000',
          onSessionExpired: () => {
            sessionExpiredNotified = true;
          },
        });

        await assert.rejects(
          async () => client.get('/workspace'),
          (err: any) => err instanceof AuthenticationError
        );

        assert.equal(sessionExpiredNotified, true, 'onSessionExpired must be triggered on genuine expiry');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('does not trigger silent refresh for exempt auth endpoints (e.g. login, register)', () => {
      assert.equal(isAuthEndpointExempt('/api/v1/auth/login'), true);
      assert.equal(isAuthEndpointExempt('/auth/register'), true);
      assert.equal(isAuthEndpointExempt('/api/v1/auth/refresh'), true);
      assert.equal(isAuthEndpointExempt('/api/v1/auth/forgot-password'), true);
      assert.equal(isAuthEndpointExempt('/domains'), false);
      assert.equal(isAuthEndpointExempt('/workspace/overview'), false);
      assert.equal(isAuthEndpointExempt('/snapshots'), false);
    });
  });

  describe('3. Workspace Context Continuity & Calm Failure UX', () => {
    it('preserves target route and query parameters for return redirection upon genuine expiry', () => {
      const redirectUrl = createPreservedRedirectUrl(
        '/workspace/changes?sourceType=historical_comparison&baseSnapshot=snp-1&targetSnapshot=snp-2'
      );
      assert.equal(
        redirectUrl,
        '/login?redirect=%2Fworkspace%2Fchanges%3FsourceType%3Dhistorical_comparison%26baseSnapshot%3Dsnp-1%26targetSnapshot%3Dsnp-2'
      );
    });

    it('resolves calm presentation state when session is active, renewing, or expired', () => {
      // 1. Active session
      const activeState = resolveSessionRenewalState({ isAuthenticated: true });
      assert.equal(activeState.state, 'AUTHENTICATED');
      assert.equal(activeState.canMakeAuthenticatedRequests, true);
      assert.equal(activeState.requiresLogin, false);

      // 2. In-flight renewal
      const renewingState = resolveSessionRenewalState({
        isAuthenticated: true,
        isRenewing: true,
      });
      assert.equal(renewingState.state, 'RENEWING');
      assert.equal(renewingState.canMakeAuthenticatedRequests, true);

      // 3. Genuine expiration
      const expiredState = resolveSessionRenewalState({
        isAuthenticated: true,
        sessionExpired: true,
      });
      assert.equal(expiredState.state, 'EXPIRED');
      assert.equal(expiredState.requiresLogin, true);
      assert.equal(expiredState.headline, 'Your session has expired.');
      assert.equal(expiredState.description, 'Sign in again to continue.');
      assert.equal(expiredState.actionLabel, 'Continue to sign in →');
    });
  });

  describe('4. Certified Invariants Verification', () => {
    it('verifies all 11 certified WX-1013 session invariants are strictly codified', () => {
      const expectedInvariants = [
        'ACTIVE_SESSION_PERSISTS',
        'NO_ACCESS_TOKEN_EXPIRY_LOGOUT',
        'SILENT_SESSION_RENEWAL',
        'SINGLE_FLIGHT_REFRESH',
        'NO_REFRESH_SECRET_EXPOSURE',
        'SESSION_REVOCATION_IS_AUTHORITATIVE',
        'DEVICE_SESSION_ISOLATION',
        'EXPLICIT_LOGOUT_IS_IMMEDIATE',
        'WORKSPACE_CONTEXT_PRESERVED',
        'AUTH_FAILURE_IS_EXPLICIT',
        'NO_INFINITE_SESSION',
      ];

      for (const inv of expectedInvariants) {
        assert.ok(
          inv in SESSION_RENEWAL_INVARIANTS,
          `Expected invariant ${inv} to exist in SESSION_RENEWAL_INVARIANTS`
        );
      }
    });
  });
});
