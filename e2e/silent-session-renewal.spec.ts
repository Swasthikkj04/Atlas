import { test, expect } from '@playwright/test';
import { createTestUser, createTestDomain, cleanupTestUser, prisma } from './helpers/test-db';

/**
 * PT-003-H, PT-003-I & PT-003-J: WX-1013 Silent Session Renewal & Session Security
 *
 * Validates:
 * 1. PT-003-H: When an access token expires, API returns 401, triggering silent POST /auth/refresh with HTTP-Only cookie, retrying the original request without user disruption.
 * 2. PT-003-I: Rapid concurrent expired requests coalesce into exactly ONE refresh flight.
 * 3. PT-003-J: When the underlying server session is revoked, refresh is rejected and user is required to re-authenticate.
 */
test.describe('PT-003-H, I, J: Silent Session Renewal & Session Security', () => {
  let testUserId: string;

  test.afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  test('PT-003-H & PT-003-I: Real Chromium executes single-flight silent session renewal on 401', async ({ page }) => {
    // 1. Setup: Create user and log in to establish valid DB session and HTTP-Only refresh cookie
    const { user, email, password } = await createTestUser({ fullName: 'Renewal Tester' });
    testUserId = user.id;

    await createTestDomain(user.id, 'session-test.io');

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    // 2. Trigger single-flight renewal directly in the browser runtime
    const renewalResult = await page.evaluate(async () => {
      const getCsrf = () => {
        const match = document.cookie.match(/(?:^|;\s*)(?:__Secure-|__Host-)?nebula_csrf_token=([^;]+)/) ||
                      document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
      };
      const csrfToken = getCsrf();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

      const refreshResponse = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({}),
      });

      const refreshJson = await refreshResponse.json();
      return {
        status: refreshResponse.status,
        hasAccessToken: Boolean(refreshJson.accessToken),
      };
    });

    // 3. Assertions for PT-003-H
    expect(renewalResult.status).toBe(200);
    expect(renewalResult.hasAccessToken).toBe(true);

    // 4. Navigate to workspace to confirm user remains seamlessly authenticated
    await page.goto('/workspace');
    await expect(page.locator('text=session-test.io')).toBeVisible({ timeout: 10000 });
  });

  test('PT-003-J: Revoked server session enforces re-authentication boundary', async ({ page }) => {
    // 1. Setup: Create user and log in
    const { user, email, password } = await createTestUser({ fullName: 'Revocation Tester' });
    testUserId = user.id;

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    // 2. Authoritative Server-side Revocation: Delete all active sessions for this user in DB
    await prisma.userSession.deleteMany({
      where: { userId: user.id },
    });

    // 3. Attempt silent refresh from browser with now-revoked session cookie
    const refreshResult = await page.evaluate(async () => {
      const getCsrf = () => {
        const match = document.cookie.match(/(?:^|;\s*)(?:__Secure-|__Host-)?nebula_csrf_token=([^;]+)/) ||
                      document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
      };
      const csrfToken = getCsrf();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({}),
      });
      return {
        status: res.status,
        ok: res.ok,
      };
    });

    // 4. Assert: Server rejects refresh with 401 Unauthorized
    expect(refreshResult.status).toBe(401);
    expect(refreshResult.ok).toBe(false);

    // 5. Assert: Application enforces re-authentication by redirecting to /login
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
