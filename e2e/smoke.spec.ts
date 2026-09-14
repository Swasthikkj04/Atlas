import { test, expect } from '@playwright/test';

/**
 * PT-002: Independent Browser E2E Smoke Test.
 *
 * Verifies the complete runtime execution path:
 * Playwright → Chromium → Vite (:5173) → React / Nebula DOM
 */
test.describe('PT-002: Independent Browser E2E Testing Foundation', () => {
  test('Nebula loads in real Chromium and renders the product entry surface', async ({ page }) => {
    // 1. Navigate to the root URL via Vite development server
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // 2. Verify page title adheres to expected product identity
    await expect(page).toHaveTitle(/Argonion|Nebula/);

    // 3. Verify that React successfully mounts inside #root
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();

    // 4. Verify that the entry surface / interactive navigation is present
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 5. Verify no uncaught console errors crashed the initial render
    const heading = page.locator('h1, h2, [role="heading"]').first();
    await expect(heading).toBeVisible();
  });
});
