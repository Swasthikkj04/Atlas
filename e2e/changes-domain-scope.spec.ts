import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestDomain,
  seedDomainWithSnapshotAndFindings,
  createTestChangeHistory,
  cleanupTestUser,
} from './helpers/test-db';

/**
 * WX-1029: Domain-Scoped Changes Surface E2E Verification
 *
 * Validates:
 * 1. Changes opened for a domain contains only that domain's changes.
 * 2. No "Timeline Scope" filter or "All Domains" pill appears inside the Changes surface.
 * 3. Header / context switcher remains the sole domain-switch mechanism.
 * 4. Switching domain via context switcher updates the Changes surface accordingly.
 * 5. Direct URL with domainId remains authoritative.
 */
test.describe('WX-1029: Domain-Scoped Changes Surface', () => {
  let testUserId: string | null = null;

  test.afterEach(async () => {
    if (testUserId) await cleanupTestUser(testUserId);
    testUserId = null;
  });

  test('Renders domain-scoped Changes surface with zero internal domain filters', async ({ page }) => {
    // 1. Setup: User with 2 domains (Stripe and OpenAI)
    const { user, email, password } = await createTestUser({ fullName: 'Scope Auditor' });
    testUserId = user.id;

    const stripeDomain = await createTestDomain(user.id, 'stripe-corp.io');
    const { snapshot: stripeSnapA } = await seedDomainWithSnapshotAndFindings({
      domainId: stripeDomain.id,
      findingsCount: 1,
      serverBanner: 'stripe-edge/1.0',
    });
    const { snapshot: stripeSnapB } = await seedDomainWithSnapshotAndFindings({
      domainId: stripeDomain.id,
      findingsCount: 2,
      serverBanner: 'stripe-edge/1.1',
    });
    await createTestChangeHistory({
      domainId: stripeDomain.id,
      previousSnapshotId: stripeSnapA.id,
      currentSnapshotId: stripeSnapB.id,
      title: 'Stripe edge proxy upgraded to 1.1',
    });

    const openaiDomain = await createTestDomain(user.id, 'openai-labs.net');
    const { snapshot: openaiSnapA } = await seedDomainWithSnapshotAndFindings({
      domainId: openaiDomain.id,
      findingsCount: 1,
    });
    const { snapshot: openaiSnapB } = await seedDomainWithSnapshotAndFindings({
      domainId: openaiDomain.id,
      findingsCount: 1,
    });
    await createTestChangeHistory({
      domainId: openaiDomain.id,
      previousSnapshotId: openaiSnapA.id,
      currentSnapshotId: openaiSnapB.id,
      title: 'OpenAI DNS records refreshed',
    });

    // 2. Log in
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workspace/);

    // 3. Navigate directly to Stripe's Changes surface
    await page.goto(`/workspace/changes?domainId=${stripeDomain.id}`);
    await page.waitForURL(new RegExp(`/workspace/changes\\?domainId=${stripeDomain.id}`));

    // 4. Assert: Changes belongs entirely to Stripe context
    await expect(page.locator('text=Meaningful differences detected between verified understandings for stripe-corp.io')).toBeVisible();
    await expect(page.locator('text=Stripe edge proxy upgraded to 1.1')).toBeVisible();

    // 5. CRITICAL WX-1029 ASSERTIONS: Zero internal domain selector / timeline scope controls
    await expect(page.locator('text=TIMELINE SCOPE')).toHaveCount(0);
    await expect(page.locator('[data-testid="filter-all-domains"]')).toHaveCount(0);
    await expect(page.locator(`[data-testid="filter-domain-${stripeDomain.id}"]`)).toHaveCount(0);
    await expect(page.locator(`[data-testid="filter-domain-${openaiDomain.id}"]`)).toHaveCount(0);

    // 6. Verify cross-domain isolation: OpenAI change is NOT rendered in Stripe's changes timeline
    await expect(page.locator('text=OpenAI DNS records refreshed')).toHaveCount(0);

    // 7. Context Switching via canonical header switcher
    const contextSwitcher = page.locator('[data-testid="domain-context-switcher-trigger"]');
    await contextSwitcher.click();

    const openaiOption = page.locator('button:has-text("openai-labs.net"), [role="option"]:has-text("openai-labs.net")').first();
    await openaiOption.click();

    // Verify URL updates to OpenAI and Changes timeline updates
    await page.waitForURL(new RegExp(`/workspace/changes\\?domainId=${openaiDomain.id}`));
    await expect(page.locator('text=Meaningful differences detected between verified understandings for openai-labs.net')).toBeVisible();
    await expect(page.locator('text=OpenAI DNS records refreshed')).toBeVisible();
    await expect(page.locator('text=Stripe edge proxy upgraded to 1.1')).toHaveCount(0);
  });
});
