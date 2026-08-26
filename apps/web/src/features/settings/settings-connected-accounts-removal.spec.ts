import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS,
} from './contracts/connected-accounts.contract.ts';
import {
  SETTINGS_SECTION_ICONOGRAPHY_MAPPING,
} from './contracts/settings-iconography.contract.ts';
import {
  CANONICAL_SETTINGS_SECTIONS,
  resolveSettingsSection,
  buildSettingsPath,
} from './contracts/settings-routing.contract.ts';

describe('AX-111: Remove Connected Accounts Settings Surface Specifications', () => {
  describe('1. Security Surface Scope & Layout Constraints', () => {
    it('restricts Security settings sections to Password & Credentials and Active Sessions & Devices', () => {
      const securitySections = Object.values(SETTINGS_SECTION_ICONOGRAPHY_MAPPING).filter(
        (s) => s.section === 'security'
      );

      assert.equal(securitySections.length, 2, 'Security surface must contain exactly 2 cards');
      assert.deepEqual(
        securitySections.map((s) => s.id),
        ['password-credentials', 'active-sessions'],
        'Only password and active sessions remain in Security'
      );

      // Verify connectedAccounts is completely omitted
      assert.equal('connectedAccounts' in SETTINGS_SECTION_ICONOGRAPHY_MAPPING, false);
    });
  });

  describe('2. Canonical Navigation & IA Preservation', () => {
    it('maintains the canonical 3-section settings architecture (Account, Security, Appearance)', () => {
      assert.equal(CANONICAL_SETTINGS_SECTIONS.length, 3);
      assert.deepEqual(
        CANONICAL_SETTINGS_SECTIONS.map((s) => s.id),
        ['account', 'security', 'appearance']
      );

      assert.equal(buildSettingsPath('security'), '/settings/security');
      assert.equal(resolveSettingsSection('/settings/security'), 'security');
    });
  });

  describe('3. P0/P1 Invariants Certification (AX-111)', () => {
    it('certifies all 8 Connected Accounts Removal hard invariants', () => {
      assert.equal(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.length, 8);
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_CONNECTED_ACCOUNTS_UI'));
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_DEAD_CONNECTED_ACCOUNTS_NAVIGATION'));
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_AUTHENTICATION_REGRESSION'));
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_OAUTH_LOGIN_REGRESSION'));
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_UNUSED_FRONTEND_PROVIDER_STATE'));
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_MOCKED_REPLACEMENT_UI'));
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_EMPTY_SETTINGS_GAP'));
      assert.ok(CONNECTED_ACCOUNTS_REMOVAL_HARD_INVARIANTS.includes('NO_SETTINGS_INFORMATION_ARCHITECTURE_DRIFT'));
    });
  });
});
