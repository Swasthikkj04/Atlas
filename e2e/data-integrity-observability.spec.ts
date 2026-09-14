import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestDomain,
  seedDomainWithSnapshotAndFindings,
  cleanupTestUser,
} from './helpers/test-db';

/**
 * PT-005-C, PT-005-F, PT-005-G, PT-005-H: API Contracts, Observability, Security Headers & Latency Baseline
 *
 * Validates:
 * 1. PT-005-C: API contracts return correct status codes, schemas, and reject malformed/non-existent resources.
 * 2. PT-005-F: API latency baseline is measured (median and p95 recorded).
 * 3. PT-005-G: Correlation IDs (corr_...) are present and propagated in headers.
 * 4. PT-005-H: Security headers (Helmet/HSTS/nosniff) are enforced on running API.
 */
test.describe('PT-005: API Contracts, Observability & Performance Audit', () => {
  let testUserId: string | null = null;

  test.afterEach(async () => {
    if (testUserId) await cleanupTestUser(testUserId);
    testUserId = null;
  });

  test('PT-005-C & G: API Contract, Correlation IDs and Security Headers', async ({ page }) => {
    const { user, email, password } = await createTestUser({ fullName: 'Observability Auditor' });
    testUserId = user.id;

    const domain = await createTestDomain(user.id, 'observability-target.io');
    const { snapshot, findings } = await seedDomainWithSnapshotAndFindings({
      domainId: domain.id,
      findingsCount: 2,
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    const auditResults = await page.evaluate(async (params) => {
      const { domainId, snapshotId, findingId } = params;

      // 1. Health check & Security headers
      const healthRes = await fetch('/api/v1/health');
      const healthHeaders = Object.fromEntries(healthRes.headers.entries());

      // 2. Valid Domain Overview Request
      const overviewRes = await fetch(`/api/v1/workspace/overview?domainId=${domainId}`);
      const overviewJson = await overviewRes.json();
      const overviewCorrId = overviewRes.headers.get('x-correlation-id');

      // 3. Valid Findings Request
      const findingsRes = await fetch(`/api/v1/findings?domainId=${domainId}`);
      const findingsJson = await findingsRes.json();

      // 4. Malformed UUID Request (should return 400 or 404)
      const malformedRes = await fetch('/api/v1/findings/invalid-not-a-uuid');

      // 5. Non-existent UUID Request (should return 404)
      const nonExistentRes = await fetch('/api/v1/snapshots/00000000-0000-0000-0000-000000000000');

      return {
        healthStatus: healthRes.status,
        nosniffHeader: healthHeaders['x-content-type-options'],
        frameOptionsHeader: healthHeaders['x-frame-options'],
        overviewStatus: overviewRes.status,
        hasOverviewBrief: Boolean(overviewJson.executiveBrief || overviewJson.brief || overviewJson.headline || overviewJson.summary),
        overviewCorrId,
        findingsStatus: findingsRes.status,
        findingsCount: Array.isArray(findingsJson) ? findingsJson.length : (findingsJson.data?.length || 0),
        malformedStatus: malformedRes.status,
        nonExistentStatus: nonExistentRes.status,
      };
    }, {
      domainId: domain.id,
      snapshotId: snapshot.id,
      findingId: findings[0].id,
    });

    // Security Headers Assertions (PT-005-H)
    expect(auditResults.healthStatus).toBe(200);
    expect(auditResults.nosniffHeader).toBe('nosniff');

    // API Contracts Assertions (PT-005-C)
    expect(auditResults.overviewStatus).toBe(200);
    expect(auditResults.hasOverviewBrief).toBe(true);
    expect(auditResults.findingsStatus).toBe(200);
    expect(auditResults.findingsCount).toBeGreaterThanOrEqual(2);
    expect([400, 404]).toContain(auditResults.malformedStatus);
    expect(auditResults.nonExistentStatus).toBe(404);

    // Observability Correlation ID Assertion (PT-005-G)
    expect(auditResults.overviewCorrId).toBeDefined();
    expect(auditResults.overviewCorrId).toMatch(/^corr_/);
  });

  test('PT-005-F: API Latency Baseline Measurement', async ({ page }) => {
    const { user, email, password } = await createTestUser({ fullName: 'Latency Auditor' });
    testUserId = user.id;

    const domain = await createTestDomain(user.id, 'latency-target.io');
    await seedDomainWithSnapshotAndFindings({
      domainId: domain.id,
      findingsCount: 2,
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    const latencies = await page.evaluate(async (domainId) => {
      const times: number[] = [];
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        const res = await fetch(`/api/v1/workspace/overview?domainId=${domainId}`);
        const end = performance.now();
        if (res.ok) {
          times.push(end - start);
        }
      }
      times.sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)];
      const p95 = times[Math.floor(times.length * 0.95)];
      return { sampleCount: times.length, median, p95 };
    }, domain.id);

    expect(latencies.sampleCount).toBe(20);
    expect(latencies.median).toBeLessThan(200);
    console.log(`[PT-005-F Latency Baseline] Overview Endpoint - Median: ${latencies.median.toFixed(2)}ms, p95: ${latencies.p95.toFixed(2)}ms`);
  });
});
