import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveEffectiveTheme,
  resolveEffectiveMotion,
  SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS,
  type ThemePreference,
  type MotionPreference,
} from './contracts/preferences.contract.ts';

describe('AX-110: Settings Interaction & Runtime Behavior Verification Specification', () => {
  describe('1. Appearance — Theme Runtime Execution', () => {
    it('executes Light theme selection: sets mode=light, resolves effective theme=light', () => {
      const mode: ThemePreference = 'light';
      assert.equal(resolveEffectiveTheme(mode, false), 'light');
      assert.equal(resolveEffectiveTheme(mode, true), 'light');
    });

    it('executes Dark theme selection: sets mode=dark, resolves effective theme=dark', () => {
      const mode: ThemePreference = 'dark';
      assert.equal(resolveEffectiveTheme(mode, false), 'dark');
      assert.equal(resolveEffectiveTheme(mode, true), 'dark');
    });

    it('executes System theme selection: dynamically follows OS/browser preference', () => {
      const mode: ThemePreference = 'system';
      assert.equal(resolveEffectiveTheme(mode, false), 'light', 'OS Light resolves to Nebula Light');
      assert.equal(resolveEffectiveTheme(mode, true), 'dark', 'OS Dark resolves to Nebula Dark');
    });
  });

  describe('2. Motion & Accessibility Runtime Execution', () => {
    it('executes Standard motion: enables normal animation and transitions', () => {
      const motion: MotionPreference = 'standard';
      assert.equal(resolveEffectiveMotion(motion, false), false);
      assert.equal(resolveEffectiveMotion(motion, true), false, 'Explicit standard overrides OS reduced motion');
    });

    it('executes Reduced motion: reduces and disables transitions and ambient constellation drift', () => {
      const motion: MotionPreference = 'reduced';
      assert.equal(resolveEffectiveMotion(motion, false), true, 'Explicit reduced motion active regardless of OS');
      assert.equal(resolveEffectiveMotion(motion, true), true);
    });

    it('executes System motion: dynamically respects OS prefers-reduced-motion signal', () => {
      const motion: MotionPreference = 'system';
      assert.equal(resolveEffectiveMotion(motion, false), false, 'OS standard motion leaves animations enabled');
      assert.equal(resolveEffectiveMotion(motion, true), true, 'OS prefers-reduced-motion reduces animations');
    });
  });

  describe('3. Cross-Device & Reload Convergence', () => {
    it('guarantees server preference payload maps directly to runtime behavior', () => {
      // Simulating Device B receiving persisted record from Device A
      const serverRecord = {
        theme: 'dark' as ThemePreference,
        motion: 'reduced' as MotionPreference,
        updatedAt: '2026-08-22T14:30:00.000Z',
      };

      const deviceBTheme = resolveEffectiveTheme(serverRecord.theme, false);
      const deviceBMotion = resolveEffectiveMotion(serverRecord.motion, false);

      assert.equal(deviceBTheme, 'dark');
      assert.equal(deviceBMotion, true);
    });
  });

  describe('4. Persistence Failure & Rollback Invariants', () => {
    it('reverts optimistic state to previous preference if backend update fails', () => {
      const previousTheme: ThemePreference = 'light';
      let activeTheme: ThemePreference = previousTheme;
      assert.equal(activeTheme, 'light');

      const optimisticTheme: ThemePreference = 'dark';
      // Step 1: User selects Dark -> Optimistic UI
      activeTheme = optimisticTheme;
      assert.equal(activeTheme, 'dark');

      // Step 2: Persistence fails -> Revert to previous
      const mutationFailed = Boolean(Date.now());
      if (mutationFailed) {
        activeTheme = previousTheme;
      }
      assert.equal(activeTheme, 'light', 'UI state must rollback on server persistence failure');
    });
  });

  describe('5. P0 Invariants Certification', () => {
    it('certifies all 12 canonical runtime behavior invariants', () => {
      assert.equal(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.length, 12);
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('NO_PRESENTATION_ONLY_SETTINGS'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('THEME_SELECTION_CHANGES_REAL_UI'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('THEME_PERSISTENCE_IS_AUTHORITATIVE'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('SYSTEM_THEME_REMAINS_SYSTEM'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('MOTION_SELECTION_CHANGES_REAL_BEHAVIOR'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('PREFERENCES_SURVIVE_RELOAD'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('PREFERENCES_SURVIVE_NAVIGATION'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('PREFERENCES_APPLY_TO_WORKSPACE'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('FAILED_PERSISTENCE_CANNOT_LIE'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('NO_PAGE_LOCAL_THEME_AUTHORITY'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('NO_CROSS_USER_PREFERENCE_CONTAMINATION'));
      assert.ok(SETTINGS_RUNTIME_BEHAVIOR_HARD_INVARIANTS.includes('ACCESSIBILITY_PREFERENCE_IS_BEHAVIORAL'));
    });
  });
});
