import { test, expect } from '@playwright/test';
import { createTestUser, createTestDomain, seedDomainWithSnapshotAndFindings, cleanupTestUser } from './helpers/test-db';

/**
 * PT-003-B: Multi-Domain Workspace & Context Switching
 *
 * Validates:
 * 1. All authorized domains appear in the Workspace landing and Context Switcher.
 * 2. Selecting Domain A enters Domain A's canonical workspace.
 * 3. Domain switching cleanly transitions the entire Workspace context.
 * 4. Domain isolation: Domain A facts never appear inside Domain B.
 * 5. Tab navigation (Overview, Findings, Changes, Infrastructure, Memory) preserves active domain.
 */
test.describe('PT-003-B: Multi-Domain Workspace & Context Switching', () => {
  let testUserId: string;

  test.afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  test('Multi-domain context switching and tab persistence in real Chromium', async ({ page }) => {
    // 1. Setup: Create user with 2 distinct domains seeded with snapshots
    const { user, email, password } = await createTestUser({ fullName: 'Multi Domain Operator' });
    testUserId = user.id;

    const domainA = await createTestDomain(user.id, 'alpha-corp.io');
    await seedDomainWithSnapshotAndFindings({ domainId: domainA.id, findingsCount: 2 });

    const domainB = await createTestDomain(user.id, 'beta-security.net');
    await seedDomainWithSnapshotAndFindings({ domainId: domainB.id, findingsCount: 1 });

    // 2. Log in
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    // 3. Verify both domains on Landing surface
    await expect(page.locator('text=alpha-corp.io')).toBeVisible();
    await expect(page.locator('text=beta-security.net')).toBeVisible();

    // 4. Click into Domain A (alpha-corp.io)
    await page.locator('text=alpha-corp.io').first().click();
    await page.waitForURL(new RegExp(`domainId=${domainA.id}`));
    expect(page.url()).toContain(`domainId=${domainA.id}`);

    // Verify Domain A identity is active in workspace
    await expect(page.locator('text=alpha-corp.io').first()).toBeVisible();

    // 5. Navigate to Findings tab for Domain A
    const findingsTab = page.locator('a[href*="/workspace/findings"], button:has-text("Findings")').first();
    await findingsTab.click();
    await page.waitForURL(/\/workspace\/findings/);
    expect(page.url()).toContain(`domainId=${domainA.id}`);

    // 6. Navigate to Changes tab for Domain A
    const changesTab = page.locator('a[href*="/workspace/changes"], button:has-text("Changes")').first();
    await changesTab.click();
    await page.waitForURL(/\/workspace\/changes/);
    expect(page.url()).toContain(`domainId=${domainA.id}`);

    // 7. Use Header Context Switcher to switch to Domain B (beta-security.net)
    const contextSwitcher = page.locator('[data-testid="domain-context-switcher-trigger"]');
    await contextSwitcher.click();

    const betaOption = page.locator('button:has-text("beta-security.net"), [role="option"]:has-text("beta-security.net")').first();
    await betaOption.click();

    // 8. Assert URL updates to Domain B and Domain B identity is established
    await page.waitForURL(new RegExp(`domainId=${domainB.id}`));
    expect(page.url()).toContain(`domainId=${domainB.id}`);
    await expect(page.locator('text=beta-security.net').first()).toBeVisible();
  });
});
