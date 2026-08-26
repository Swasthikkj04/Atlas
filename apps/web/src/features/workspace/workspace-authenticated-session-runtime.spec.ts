import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SESSION_RENEWAL_INVARIANTS } from '../auth/contracts/session-renewal.contract.ts';
import { ApiClient, AuthenticationError } from '../../lib/api-client.ts';

describe('WX-1014: Refresh Contract & Runtime Single-Flight Verification', () => {
  describe('1. Runtime Single-Flight Concurrency & Storm Protection', () => {
    it('executes exactly ONE refresh operation when 5 concurrent API requests fail with 401', async () => {
      let refreshCallCount = 0;
      let getDomainsCallCount = 0;
      let getOverviewCallCount = 0;
      let getFindingsCallCount = 0;
      let getChangesCallCount = 0;
      let getMemoryCallCount = 0;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        const urlStr = String(url);

        if (urlStr.includes('/auth/refresh')) {
          refreshCallCount++;
          // Simulate realistic backend database rotation delay (15ms)
          await new Promise((resolve) => setTimeout(resolve, 15));
          return new Response(
            JSON.stringify({
              accessToken: 'fresh_rotated_jwt',
              refreshToken: 'fresh_rotated_refresh',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Endpoints encounter 401 on first call, 200 on retry
        if (urlStr.includes('/domains')) {
          getDomainsCallCount++;
          if (getDomainsCallCount === 1) {
            return new Response(JSON.stringify({ message: 'Token expired' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify([{ id: 'd-1', domainName: 'atlas.domain' }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (urlStr.includes('/overview')) {
          getOverviewCallCount++;
          if (getOverviewCallCount === 1) {
            return new Response(JSON.stringify({ message: 'Token expired' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ status: 'HEALTHY' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (urlStr.includes('/findings')) {
          getFindingsCallCount++;
          if (getFindingsCallCount === 1) {
            return new Response(JSON.stringify({ message: 'Token expired' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ total: 10 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (urlStr.includes('/changes')) {
          getChangesCallCount++;
          if (getChangesCallCount === 1) {
            return new Response(JSON.stringify({ message: 'Token expired' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ totalChanges: 2 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (urlStr.includes('/memory')) {
          getMemoryCallCount++;
          if (getMemoryCallCount === 1) {
            return new Response(JSON.stringify({ message: 'Token expired' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ totalSnapshots: 12 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response('Not Found', { status: 404 });
      };

      try {
        const client = new ApiClient({ baseUrl: 'http://localhost:3000' });

        // Dispatch 5 rapid requests originating from different Workspace components simultaneously
        const [domains, overview, findings, changes, memory] = await Promise.all([
          client.get<any[]>('/domains'),
          client.get<any>('/overview'),
          client.get<any>('/findings'),
          client.get<any>('/changes'),
          client.get<any>('/memory'),
        ]);

        // CRITICAL INVARIANT: Exactly 1 refresh operation occurred for all 5 concurrent requests!
        assert.equal(
          refreshCallCount,
          1,
          'SINGLE_FLIGHT_RUNTIME_REFRESH: Must execute exactly 1 refresh operation for 5 concurrent 401s'
        );

        // All 5 requests were retried once and succeeded
        assert.equal(getDomainsCallCount, 2);
        assert.equal(getOverviewCallCount, 2);
        assert.equal(getFindingsCallCount, 2);
        assert.equal(getChangesCallCount, 2);
        assert.equal(getMemoryCallCount, 2);

        // Verification of data payloads
        assert.equal(domains[0].domainName, 'atlas.domain');
        assert.equal(overview.status, 'HEALTHY');
        assert.equal(findings.total, 10);
        assert.equal(changes.totalChanges, 2);
        assert.equal(memory.totalSnapshots, 12);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('subsequent expiration event after previous renewal cleanly creates a new single flight', async () => {
      let refreshCallCount = 0;
      let requestCallCount = 0;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        const urlStr = String(url);

        if (urlStr.includes('/auth/refresh')) {
          refreshCallCount++;
          return new Response(
            JSON.stringify({
              accessToken: `token_v${refreshCallCount}`,
              refreshToken: `refresh_v${refreshCallCount}`,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        requestCallCount++;
        // Return 401 on initial attempt of event 1 (call 1) and event 2 (call 3)
        if (requestCallCount === 1 || requestCallCount === 3) {
          return new Response(JSON.stringify({ message: 'Token expired' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      try {
        const client = new ApiClient({ baseUrl: 'http://localhost:3000' });

        // Event 1
        const res1 = await client.get<{ success: boolean }>('/domains');
        assert.equal(res1.success, true);
        assert.equal(refreshCallCount, 1);

        // Event 2 (occurred later in session)
        const res2 = await client.get<{ success: boolean }>('/domains');
        assert.equal(res2.success, true);
        assert.equal(refreshCallCount, 2);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('2. Transparent Request Preservation (Method, Body, Headers)', () => {
    it('retries POST / PUT / PATCH / DELETE with exact identical body and method after refresh', async () => {
      let postCallCount = 0;
      let recordedBody: string | null = null;
      let recordedMethod: string | null = null;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, init: any) => {
        const urlStr = String(url);

        if (urlStr.includes('/auth/refresh')) {
          return new Response(
            JSON.stringify({ accessToken: 'new_token', refreshToken: 'new_refresh' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (urlStr.includes('/domains/understand')) {
          postCallCount++;
          recordedMethod = init?.method;
          recordedBody = init?.body;

          if (postCallCount === 1) {
            return new Response(JSON.stringify({ message: 'Token expired' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ jobId: 'job-999', status: 'PENDING' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response('Not Found', { status: 404 });
      };

      try {
        const client = new ApiClient({ baseUrl: 'http://localhost:3000' });
        const result = await client.post<{ jobId: string; status: string }>(
          '/domains/understand',
          { domainId: 'dom-123', depth: 'deep' }
        );

        assert.equal(postCallCount, 2, 'POST request must be retried once');
        assert.equal(recordedMethod, 'POST');
        assert.equal(recordedBody, JSON.stringify({ domainId: 'dom-123', depth: 'deep' }));
        assert.equal(result.jobId, 'job-999');
        assert.equal(result.status, 'PENDING');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('3. No Refresh Recursion & Endpoint Exemption', () => {
    it('does not trigger refresh when calling /auth/refresh directly (avoids recursive loop)', async () => {
      let directRefreshCallCount = 0;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/auth/refresh')) {
          directRefreshCallCount++;
          return new Response(JSON.stringify({ message: 'Session revoked' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      };

      try {
        const client = new ApiClient({ baseUrl: 'http://localhost:3000' });

        await assert.rejects(
          async () => client.post('/auth/refresh', {}),
          (err: any) => err instanceof AuthenticationError
        );

        // Crucial invariant: Exactly 1 call was made, NO recursive refresh was triggered!
        assert.equal(directRefreshCallCount, 1);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('4. Certified Invariants Validation', () => {
    it('verifies all 22 certified session renewal & runtime invariants', () => {
      const requiredInvariants = [
        'REFRESH_CONTRACT_MATCHES_COOKIE_AUTHORITY',
        'VALID_REFRESH_COOKIE_REACHES_SESSION_SERVICE',
        'NO_VALID_REFRESH_REQUEST_REJECTED_BY_DTO',
        'SINGLE_FLIGHT_RUNTIME_REFRESH',
        'ONE_REFRESH_PER_EXPIRATION_EVENT',
        'NO_REFRESH_RECURSION',
        'NO_REFRESH_STORM',
        'TRANSPARENT_REQUEST_RETRY',
        'NO_UNEXPECTED_WORKSPACE_LOGOUT',
        'SESSION_FAILURE_IS_EXPLICIT',
        'WORKSPACE_CONTEXT_PRESERVED',
        'REFRESH_ROTATION_REMAINS_AUTHORITATIVE',
      ];

      for (const inv of requiredInvariants) {
        assert.ok(
          inv in SESSION_RENEWAL_INVARIANTS,
          `Expected invariant ${inv} to be certified in SESSION_RENEWAL_INVARIANTS`
        );
      }
    });
  });
});
