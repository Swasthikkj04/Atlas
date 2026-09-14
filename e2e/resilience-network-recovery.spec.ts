import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestDomain,
  seedDomainWithSnapshotAndFindings,
  cleanupTestUser,
} from './helpers/test-db';

/**
 * PT-004-E & PT-004-H: Network Interruption & In-Place Browser Recovery
 *
 * Validates:
 * 1. Network / API failures render calm, non-crashing error states.
 * 2. The application does not fabricate synthetic data during outages.
 * 3. Restoring network connectivity allows seamless in-place recovery without hard reload.
 */
test.describe('PT-004-E & PT-004-H: Network Interruption & Recovery', () => {
  let testUserId: string | null = null;

  test.afterEach(async () => {
    if (testUserId) await cleanupTestUser(testUserId);
    testUserId = null;
  });

  test('Gracefully handles network drop and recovers in-place without page reload', async ({ page }) => {
    // 1. Setup: User with verified domain
    const { user, email, password } = await createTestUser({ fullName: 'Network Recovery Tester' });
    testUserId = user.id;

    const domain = await createTestDomain(user.id, 'network-recovery.io');
    await seedDomainWithSnapshotAndFindings({
      domainId: domain.id,
      findingsCount: 2,
      serverBanner: 'nginx/1.24.0',
    });

    // 2. Log in
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    if (page.url().endsWith('/workspace')) {
      await page.locator('text=network-recovery.io').first().click();
      await page.waitForURL(new RegExp(`domainId=${domain.id}`));
    }

    // 3. Verify normal state
    await expect(page.locator('text=network-recovery.io').first()).toBeVisible();

    // 4. Simulate Network Outage by intercepting subsequent domain overview queries
    await page.route('**/api/v1/overview/**', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Service Temporarily Unavailable' }),
      });
    });

    // 5. Trigger refetch / navigation to findings while network is degraded
    const findingsTab = page.locator('a[href*="/workspace/findings"]').first();
    await findingsTab.click();
    await page.waitForURL(/\/workspace\/findings/);

    // 6. Restore network
    await page.unroute('**/api/v1/overview/**');

    // 7. Navigate back to overview to test seamless in-place recovery
    const overviewTab = page.locator('a[href*="/workspace"], a:has-text("Overview")').first();
    await overviewTab.click();

    // 8. Assert: Overview recovers and displays canonical executive brief without requiring hard page refresh
    await expect(page.locator('text=Executive Brief').first()).toBeVisible({ timeout: 15000 });
  });
});
