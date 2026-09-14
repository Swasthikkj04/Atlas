import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestDomain,
  seedDomainWithSnapshotAndFindings,
  cleanupTestUser,
} from './helpers/test-db';

/**
 * PT-004-B: Authorization & Tenant Isolation Boundaries
 *
 * Validates:
 * 1. User A cannot access Domain B via workspace URL navigation.
 * 2. Cross-domain isolation UI prevents leaking victim tenant intelligence.
 * 3. User A cannot fetch Domain B's snapshots, findings, or evidence via API.
 * 4. User A cannot trigger understanding scans against Domain B.
 */
test.describe('PT-004-B: Authorization & Tenant Isolation Boundaries', () => {
  let userAId: string | null = null;
  let userBId: string | null = null;

  test.afterEach(async () => {
    if (userAId) await cleanupTestUser(userAId);
    if (userBId) await cleanupTestUser(userBId);
    userAId = null;
    userBId = null;
  });

  test('Enforces strict tenant isolation across UI and API endpoints', async ({ page }) => {
    // 1. Setup Tenant A (Attacker / Requesting User)
    const { user: userA, email: emailA, password: passwordA } = await createTestUser({
      fullName: 'Tenant A User',
    });
    userAId = userA.id;
    await createTestDomain(userA.id, 'tenant-a-public.io');

    // 2. Setup Tenant B (Victim / Target Tenant with private findings)
    const { user: userB } = await createTestUser({
      fullName: 'Tenant B Victim',
    });
    userBId = userB.id;
    const domainB = await createTestDomain(userB.id, 'tenant-b-confidential.io');
    const { snapshot: snapB, findings: findingsB } = await seedDomainWithSnapshotAndFindings({
      domainId: domainB.id,
      findingsCount: 2,
      serverBanner: 'confidential-corp/4.2.0',
    });

    // 3. User A logs in
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(emailA);
    await page.locator('input[type="password"]').fill(passwordA);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    // 4. Test UI Isolation: User A attempts navigating directly to Domain B's workspace URL
    await page.goto(`/workspace?domainId=${domainB.id}`);

    // Assert: User A sees unauthorized / unallocated state, and Domain B's confidential banner is NOT rendered
    await expect(page.locator('text=confidential-corp/4.2.0')).toHaveCount(0);
    await expect(page.locator('text=tenant-b-confidential.io')).toHaveCount(0);

    // 5. Test API Isolation: Direct authenticated requests from User A's browser context
    const apiIsolationResults = await page.evaluate(async (params) => {
      const { domainBId, snapshotBId, findingBId } = params;

      // Request 1: Attempt to fetch Domain B metadata
      const resDomain = await fetch(`/api/v1/domains/${domainBId}`);

      // Request 2: Attempt to fetch Domain B snapshot
      const resSnapshot = await fetch(`/api/v1/snapshots/${snapshotBId}`);

      // Request 3: Attempt to fetch Domain B finding
      const resFinding = await fetch(`/api/v1/findings/${findingBId}`);

      // Request 4: Attempt to trigger scan on Domain B
      const getCsrf = () => {
        const match = document.cookie.match(/(?:^|;\s*)(?:__Secure-|__Host-)?nebula_csrf_token=([^;]+)/) ||
                      document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
      };
      const csrfToken = getCsrf();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

      const resScan = await fetch(`/api/v1/domains/${domainBId}/understand`, {
        method: 'POST',
        headers,
      });

      return {
        domainStatus: resDomain.status,
        snapshotStatus: resSnapshot.status,
        findingStatus: resFinding.status,
        scanStatus: resScan.status,
      };
    }, {
      domainBId: domainB.id,
      snapshotBId: snapB.id,
      findingBId: findingsB[0].id,
    });

    // 6. Assertions: All unauthorized access attempts are blocked with 403 Forbidden or 404 Not Found
    expect([403, 404]).toContain(apiIsolationResults.domainStatus);
    expect([403, 404]).toContain(apiIsolationResults.snapshotStatus);
    expect([403, 404]).toContain(apiIsolationResults.findingStatus);
    expect([403, 404]).toContain(apiIsolationResults.scanStatus);
  });
});
