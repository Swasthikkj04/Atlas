import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAppRoute, ROUTES } from '../../routes/routes.ts';
import {
  CANONICAL_SETTINGS_SECTIONS,
  resolveSettingsSection,
  buildSettingsPath,
  SETTINGS_HARD_INVARIANTS,
} from './contracts/settings-routing.contract.ts';

describe('AX-102: Settings Navigation, Routing & Layout Shell Specifications', () => {
  describe('1. Settings Route Resolution Engine', () => {
    it('resolves /settings and /settings/ to SETTINGS route', () => {
      assert.equal(resolveAppRoute('/settings'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/'), 'SETTINGS');
    });

    it('resolves canonical sub-routes /settings/account, /settings/security, and /settings/appearance to SETTINGS route', () => {
      assert.equal(resolveAppRoute('/settings/account'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/security'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/appearance'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/account/'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/security/'), 'SETTINGS');
      assert.equal(resolveAppRoute('/settings/appearance/'), 'SETTINGS');
    });

    it('defines canonical constant URIs in ROUTES.SETTINGS', () => {
      assert.equal(ROUTES.SETTINGS.ROOT, '/settings');
      assert.equal(ROUTES.SETTINGS.ACCOUNT, '/settings/account');
      assert.equal(ROUTES.SETTINGS.SECURITY, '/settings/security');
      assert.equal(ROUTES.SETTINGS.APPEARANCE, '/settings/appearance');
    });
  });

  describe('2. Canonical Settings Section Resolution Engine', () => {
    it('defaults /settings and /settings/ to account section', () => {
      assert.equal(resolveSettingsSection('/settings'), 'account');
      assert.equal(resolveSettingsSection('/settings/'), 'account');
      assert.equal(resolveSettingsSection(''), 'account');
    });

    it('resolves explicit paths to respective sections', () => {
      assert.equal(resolveSettingsSection('/settings/account'), 'account');
      assert.equal(resolveSettingsSection('/settings/security'), 'security');
      assert.equal(resolveSettingsSection('/settings/appearance'), 'appearance');
    });

    it('falls back unrecognized settings subroutes safely to account', () => {
      assert.equal(resolveSettingsSection('/settings/unknown'), 'account');
      assert.equal(resolveSettingsSection('/settings/future-feature'), 'account');
    });

    it('builds canonical settings path for each section', () => {
      assert.equal(buildSettingsPath('account'), '/settings/account');
      assert.equal(buildSettingsPath('security'), '/settings/security');
      assert.equal(buildSettingsPath('appearance'), '/settings/appearance');
    });
  });

  describe('3. Canonical Navigation Inventory & Information Architecture', () => {
    it('defines exactly the 3 active canonical sections without premature future entries', () => {
      assert.equal(CANONICAL_SETTINGS_SECTIONS.length, 3);

      const sectionIds = CANONICAL_SETTINGS_SECTIONS.map((s) => s.id);
      assert.deepEqual(sectionIds, ['account', 'security', 'appearance']);

      // Guarantees no dead navigation or unreleased features
      assert.equal(sectionIds.includes('account'), true);
      assert.equal(sectionIds.includes('security'), true);
      assert.equal(sectionIds.includes('appearance'), true);
    });

    it('provides clear descriptive metadata and canonical paths for all sections', () => {
      for (const section of CANONICAL_SETTINGS_SECTIONS) {
        assert.ok(section.title.length > 0);
        assert.ok(section.path.startsWith('/settings/'));
        assert.ok(section.description.length > 0);
      }
    });
  });

  describe('4. P0 Settings Foundation Hard Invariants Certification', () => {
    it('certifies all 10 canonical settings hard invariants', () => {
      assert.equal(SETTINGS_HARD_INVARIANTS.length, 10);
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_UNPROTECTED_SETTINGS_ROUTE'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_DEAD_SETTINGS_NAVIGATION_LINKS'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_UNAUTHENTICATED_SETTINGS_ACCESS'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_INVENTED_SETTINGS_DESIGN_TOKENS'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_MOCKED_CAPABILITY_DATA'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_DISCONNECTED_SETTINGS_SHELL'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_BROKEN_SETTINGS_DEEP_LINKS'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_ACCESSIBILITY_LANDMARK_LOSS'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_BROKEN_BROWSER_HISTORY_NAVIGATION'));
      assert.ok(SETTINGS_HARD_INVARIANTS.includes('NO_PREMATURE_CAPABILITY_EXPOSURE'));
    });
  });
});
