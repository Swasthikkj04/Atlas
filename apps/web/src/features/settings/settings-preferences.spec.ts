import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveEffectiveTheme,
  resolveEffectiveMotion,
  formatThemeLabel,
  formatMotionLabel,
  PREFERENCES_HARD_INVARIANTS,
} from './contracts/preferences.contract.ts';

describe('AX-107: User Preferences & Appearance Specifications', () => {
  describe('1. Authoritative Theme Resolution Engine', () => {
    it('resolves system mode based on operating system color scheme', () => {
      assert.equal(resolveEffectiveTheme('system', true), 'dark');
      assert.equal(resolveEffectiveTheme('system', false), 'light');
    });

    it('resolves explicit light theme regardless of operating system state', () => {
      assert.equal(resolveEffectiveTheme('light', true), 'light');
      assert.equal(resolveEffectiveTheme('light', false), 'light');
    });

    it('resolves explicit dark theme regardless of operating system state', () => {
      assert.equal(resolveEffectiveTheme('dark', true), 'dark');
      assert.equal(resolveEffectiveTheme('dark', false), 'dark');
    });
  });

  describe('2. Authoritative Motion Resolution Engine', () => {
    it('resolves system motion mode based on operating system prefers-reduced-motion signal', () => {
      assert.equal(resolveEffectiveMotion('system', true), true);
      assert.equal(resolveEffectiveMotion('system', false), false);
    });

    it('resolves explicit standard motion as full animation (false for reduced)', () => {
      assert.equal(resolveEffectiveMotion('standard', true), false);
      assert.equal(resolveEffectiveMotion('standard', false), false);
    });

    it('resolves explicit reduced motion as reduced animation (true for reduced)', () => {
      assert.equal(resolveEffectiveMotion('reduced', true), true);
      assert.equal(resolveEffectiveMotion('reduced', false), true);
    });
  });

  describe('3. Preference Display Formatters', () => {
    it('formats theme labels into human-friendly strings', () => {
      assert.equal(formatThemeLabel('system'), 'System (Auto)');
      assert.equal(formatThemeLabel('light'), 'Light');
      assert.equal(formatThemeLabel('dark'), 'Dark');
    });

    it('formats motion labels into human-friendly strings', () => {
      assert.equal(formatMotionLabel('system'), 'System (Auto)');
      assert.equal(formatMotionLabel('standard'), 'Standard Motion');
      assert.equal(formatMotionLabel('reduced'), 'Reduced Motion');
    });
  });

  describe('4. P0 User Preferences Hard Invariants Certification', () => {
    it('certifies all 12 canonical preference management hard invariants', () => {
      assert.equal(PREFERENCES_HARD_INVARIANTS.length, 12);
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('NO_UNAUTHORIZED_PREFERENCE_ACCESS'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('NO_CROSS_USER_PREFERENCE_LEAKAGE'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('NO_ARBITRARY_PREFERENCE_MUTATION'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('BACKEND_AUTHORITATIVE_PERSISTENCE'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('NO_LOCALSTORAGE_ONLY_PERSISTENCE'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('CANONICAL_THEME_ENUM_ONLY'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('SYSTEM_THEME_REMAINS_SYSTEM'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('NO_MOCKED_PREFERENCE_STATE'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('UI_CONVERGES_TO_SERVER_TRUTH'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('FAILED_PERSISTENCE_CANNOT_SILENTLY_LIE'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('MOTION_PREFERENCE_RESPECTS_ACCESSIBILITY'));
      assert.ok(PREFERENCES_HARD_INVARIANTS.includes('NO_PREMATURE_NOTIFICATION_OR_WORKSPACE_PREFERENCES'));
    });
  });
});
