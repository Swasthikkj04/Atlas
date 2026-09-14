import { test, expect } from '@playwright/test';
import { createTestUser, createTestDomain, cleanupTestUser } from './helpers/test-db';

/**
 * PT-003-A: Authentication & Multi-Domain Workspace Entry
 *
 * Validates:
 * 1. Real user logs in through UI with valid credentials.
 * 2. Authenticated session is established and cookie set.
 * 3. User is routed to /workspace.
 * 4. Multi-domain user lands on the Cross-Domain Intelligence Landing surface.
 * 5. User is not arbitrarily dropped into a single domain.
 */
test.describe('PT-003-A: Authentication & Workspace Entry', () => {
  let testUserId: string;

  test.afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  test('Multi-domain user logs in and lands on Cross-Domain Intelligence surface', async ({ page, context }) => {
    // 1. Setup: Create real active user with 2 domains in DB
    const { user, email, password } = await createTestUser({
      fullName: 'Atlas Operator',
    });
    testUserId = user.id;

    await createTestDomain(user.id, 'alpha-corp.io');
    await createTestDomain(user.id, 'beta-cloud.net');

    // 2. Navigate to Login Page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Argonion|Nebula/);

    // 3. Fill and submit login form
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // 4. Verify successful redirect to /workspace
    await page.waitForURL(/\/workspace/, { timeout: 15000 });
    expect(page.url()).toContain('/workspace');

    // 5. Verify refresh token cookie is set in browser context
    const cookies = await context.cookies();
    const hasRefreshCookie = cookies.some((c) => c.name.includes('refresh') || c.name.includes('atlas') || c.name.includes('session'));
    expect(hasRefreshCookie).toBe(true);

    // 6. Assert multi-domain user lands on Cross-Domain Landing Briefing (not forced to single domain)
    // The landing briefing contains "Monitored Infrastructure" and both domains
    const landingHeading = page.locator('text=Monitored Infrastructure').or(page.locator('text=Cross-Domain Intelligence')).or(page.locator('text=verified understanding'));
    await expect(landingHeading.first()).toBeVisible({ timeout: 10000 });

    // 7. Verify both domains are visible on the landing surface
    await expect(page.locator('text=alpha-corp.io')).toBeVisible();
    await expect(page.locator('text=beta-cloud.net')).toBeVisible();
  });
});
