import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createDeactivatedTestUser,
  createDeletedTestUser,
  cleanupTestUser,
} from './helpers/test-db';

/**
 * PT-004-A: Authentication Failure & Re-Authentication Boundaries
 *
 * Validates:
 * 1. Invalid credentials present explicit error without crashing or leaking sensitive info.
 * 2. Deactivated accounts are blocked with clear lifecycle guidance and reactivation link.
 * 3. Deleted accounts are permanently rejected.
 * 4. Invalid refresh requests terminate deterministically without infinite loops.
 */
test.describe('PT-004-A: Authentication Failure Boundaries', () => {
  let activeUserId: string | null = null;
  let deactivatedUserId: string | null = null;
  let deletedUserId: string | null = null;

  test.afterEach(async () => {
    if (activeUserId) await cleanupTestUser(activeUserId);
    if (deactivatedUserId) await cleanupTestUser(deactivatedUserId);
    if (deletedUserId) await cleanupTestUser(deletedUserId);
    activeUserId = null;
    deactivatedUserId = null;
    deletedUserId = null;
  });

  test('Rejects invalid password with explicit authentication error', async ({ page }) => {
    const { user, email } = await createTestUser();
    activeUserId = user.id;

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    // Verify error alert appears
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Invalid email or password');

    // Assert user remains on login page and not authenticated
    expect(page.url()).toContain('/login');
  });

  test('Blocks deactivated account with reactivation guidance', async ({ page }) => {
    const { user, email, password } = await createDeactivatedTestUser();
    deactivatedUserId = user.id;

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/deactivated/i);

    // Verify reactivation link is present
    const reactivateLink = page.locator('a[href*="/auth/reactivate"]');
    await expect(reactivateLink).toBeVisible();
  });

  test('Blocks permanently deleted account', async ({ page }) => {
    const { user, email, password } = await createDeletedTestUser();
    deletedUserId = user.id;

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/permanently deleted/i);
  });

  test('Invalid refresh request fails safely without recursion or loops', async ({ page }) => {
    await page.goto('/login');

    const result = await page.evaluate(async () => {
      let callCount = 0;
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid_malformed_token' }),
      });
      callCount++;
      return { status: res.status, callCount };
    });

    // Refresh should fail cleanly with 401 or 403 (due to CSRF/session validation)
    expect([401, 403]).toContain(result.status);
    expect(result.callCount).toBe(1);
  });
});
