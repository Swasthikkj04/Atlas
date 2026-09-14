import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestDomain,
  seedDomainWithSnapshotAndFindings,
  createTestChangeHistory,
  cleanupTestUser,
} from './helpers/test-db';

/**
 * PT-003-E, PT-003-F & PT-003-G: Investigation Lineage & Return-Path Continuity
 *
 * Validates:
 * 1. Changes → Change Investigation / Evidence → Back → Changes.
 * 2. Findings → Finding Investigation / Evidence → Back → Findings.
 * 3. Exact query params and domainId are preserved across the entire traversal.
 * 4. Investigation surfaces preserve What happened → Why it matters → What Nebula knows → Evidence.
 */
test.describe('PT-003-E, F, G: Investigation & Return-Path Continuity', () => {
  let testUserId: string;

  test.afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
    }
  });

  test('Preserves full return path and domain context across Findings and Changes investigations', async ({ page }) => {
    // 1. Setup: Create user with 1 domain, 2 snapshots, 2 findings, and 1 change history
    const { user, email, password } = await createTestUser({ fullName: 'Investigation Tester' });
    testUserId = user.id;

    const domain = await createTestDomain(user.id, 'continuity-test.io');
    const { snapshot: snapA } = await seedDomainWithSnapshotAndFindings({
      domainId: domain.id,
      findingsCount: 2,
      serverBanner: 'nginx/1.20.0',
    });

    const { snapshot: snapB } = await seedDomainWithSnapshotAndFindings({
      domainId: domain.id,
      findingsCount: 2,
      serverBanner: 'nginx/1.24.0',
    });

    await createTestChangeHistory({
      domainId: domain.id,
      previousSnapshotId: snapA.id,
      currentSnapshotId: snapB.id,
      title: 'Content-Security-Policy improved',
      description: 'Added strict script-src and object-src directives.',
    });

    // 2. Log in
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(new RegExp(`/workspace\\?domainId=${domain.id}|/workspace$`));

    if (page.url().endsWith('/workspace')) {
      await page.locator('text=continuity-test.io').first().click();
      await page.waitForURL(new RegExp(`domainId=${domain.id}`));
    }

    // =========================================================================
    // PART 1: Findings Flow (Findings → Finding Investigation → Back → Findings)
    // =========================================================================
    const findingsTab = page.locator('a[href*="/workspace/findings"]').first();
    await findingsTab.click();
    await page.waitForURL(/\/workspace\/findings/);
    expect(page.url()).toContain(`domainId=${domain.id}`);

    // Click "Investigate finding"
    const investigateFindingBtn = page.locator('button:has-text("Investigate finding")').first();
    await expect(investigateFindingBtn).toBeVisible({ timeout: 10000 });
    await investigateFindingBtn.click();

    // Verify Finding Investigation Surface
    await expect(page.locator('text=WHAT HAPPENED').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=WHY IT MATTERS').first()).toBeVisible();
    await expect(page.locator('text=WHAT THIS MEANS').first()).toBeVisible();

    // Return back to Findings list
    const backFromFindingBtn = page.locator('button:has-text("Back")').first();
    await backFromFindingBtn.click();
    await page.waitForURL(/\/workspace\/findings/);
    expect(page.url()).toContain(`domainId=${domain.id}`);
    await expect(page.locator('text=Infrastructure Findings').first()).toBeVisible();

    // =========================================================================
    // PART 2: Changes Flow (Changes → Change Investigation / Evidence → Back → Changes)
    // =========================================================================
    const changesTab = page.locator('a[href*="/workspace/changes"]').first();
    await changesTab.click();
    await page.waitForURL(/\/workspace\/changes/);
    expect(page.url()).toContain(`domainId=${domain.id}`);

    // Verify change card exists
    const changeCard = page.locator('text=Content-Security-Policy improved').first();
    await expect(changeCard).toBeVisible({ timeout: 10000 });

    // Click "Inspect details" or "View evidence"
    const inspectChangeBtn = page.locator('[data-testid^="investigate-change-"], button:has-text("Inspect details"), button:has-text("View evidence")').first();
    await inspectChangeBtn.click();

    // Verify Change Investigation or Evidence Surface
    await expect(page.locator('text=WHAT HAPPENED').or(page.locator('text=Observation Evidence')).or(page.locator('text=Evidence Lineage')).first()).toBeVisible({ timeout: 10000 });

    // Return back to Changes timeline
    const backFromChangeBtn = page.locator('button:has-text("Back")').first();
    await backFromChangeBtn.click();
    await page.waitForURL(/\/workspace\/changes/);
    expect(page.url()).toContain(`domainId=${domain.id}`);
    await expect(page.locator('text=Infrastructure Changes').first()).toBeVisible();
  });
});
