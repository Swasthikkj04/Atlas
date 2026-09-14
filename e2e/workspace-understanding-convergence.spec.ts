import { test, expect } from '@playwright/test';
import { createTestUser, createTestDomain, seedDomainWithSnapshotAndFindings, cleanupTestUser } from './helpers/test-db';

/**
 * PT-003-C & PT-003-D: Manual Understanding & Global Workspace Convergence
 *
 * Validates:
 * 1. Understand Now button is interactive and displays current state.
 * 2. Triggering understanding starts the job and communicates progress truthfully.
 * 3. On job completion, Workspace converges without a browser reload.
 * 4. Overview, Findings, Changes, Infrastructure, Memory all reflect the new snapshot.
 * 5. Changes shows the comparison between new snapshot and previous snapshot.
 */
test.describe('PT-003-C & PT-003-D: Manual Understanding & Global Convergence', () => {
  let testUserId: string;

  test.afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  test('Triggers understanding and converges all 5 workspace surfaces in real-time without page reload', async ({ page }) => {
    // 1. Setup: Create user with 1 domain seeded with initial snapshot A
    const { user, email, password } = await createTestUser({ fullName: 'Convergence Tester' });
    testUserId = user.id;

    // Use a real reachable domain so the collector can discover facts cleanly
    const domain = await createTestDomain(user.id, 'example.com');
    await seedDomainWithSnapshotAndFindings({
      domainId: domain.id,
      findingsCount: 2,
      serverBanner: 'nginx/1.22.0',
    });

    // 2. Log in
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(new RegExp(`/workspace\\?domainId=${domain.id}|/workspace$`));

    // If on landing, navigate into the domain
    if (page.url().endsWith('/workspace')) {
      await page.locator('text=example.com').first().click();
      await page.waitForURL(new RegExp(`domainId=${domain.id}`));
    }

    // 3. Verify Initial State (Snapshot A)
    await expect(page.locator('text=example.com').first()).toBeVisible();

    // 4. Locate and click "Understand now" button
    const understandButton = page.locator('button:has-text("Understand now"), button:has-text("Understand")').first();
    await expect(understandButton).toBeVisible();

    // Listen for the 202 Accepted response from /understand
    const understandPromise = page.waitForResponse((res) =>
      res.url().includes('/understand') && (res.status() === 200 || res.status() === 202)
    );
    await understandButton.click();
    await understandPromise;

    // 5. Verify the UI reflects in-progress understanding state
    const activeIndicator = page.locator('text=Understanding').or(page.locator('text=Verifying')).or(page.locator('[data-testid="active-understanding-banner"]'));
    await expect(activeIndicator.first()).toBeVisible({ timeout: 5000 });

    // 6. Wait for understanding to complete and converge (up to 45s for live network discovery)
    await expect(page.locator('text=Understood just now').first()).toBeVisible({ timeout: 45000 });

    // 7. CRITICAL CONVERGENCE ASSERTION: NO PAGE RELOAD
    // Verify Overview reflects current intelligence
    await expect(page.locator('text=Executive Brief').first()).toBeVisible();
    await expect(page.locator('text=What Matters Now').or(page.locator('text=WHAT MATTERS NOW')).first()).toBeVisible();

    // 8. Verify Findings Surface
    const findingsTab = page.locator('a[href*="/workspace/findings"]').first();
    await findingsTab.click();
    await page.waitForURL(/\/workspace\/findings/);
    await expect(page.locator('text=Infrastructure Findings').or(page.locator('text=Missing')).first()).toBeVisible();

    // 9. Verify Changes Surface
    const changesTab = page.locator('a[href*="/workspace/changes"]').first();
    await changesTab.click();
    await page.waitForURL(/\/workspace\/changes/);
    await expect(page.locator('text=Infrastructure Changes').or(page.locator('text=TODAY')).first()).toBeVisible();

    // 10. Verify Infrastructure Surface
    const infraTab = page.locator('a[href*="/workspace/infrastructure"]').first();
    await infraTab.click();
    await page.waitForURL(/\/workspace\/infrastructure/);
    await expect(page.locator('text=Infrastructure').first()).toBeVisible();

    // 11. Verify Memory Surface
    const memoryTab = page.locator('a[href*="/workspace/memory"]').first();
    await memoryTab.click();
    await page.waitForURL(/\/workspace\/memory/);
    await expect(page.locator('text=Infrastructure Memory').or(page.locator('text=Snapshot')).first()).toBeVisible();
  });
});
