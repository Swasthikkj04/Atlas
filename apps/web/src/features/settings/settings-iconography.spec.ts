import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  KeyRound,
  Link2,
  MonitorSmartphone,
  UserRound,
  UserRoundCog,
  Palette,
  Sparkles,
} from 'lucide-react';
import { resolveIconProps } from '../../components/icons/icon-props.ts';
import {
  SETTINGS_SECTION_ICONOGRAPHY_MAPPING,
  SETTINGS_ICONOGRAPHY_HARD_INVARIANTS,
} from './contracts/settings-iconography.contract.ts';

const ICON_MAP = {
  KeyRound,
  Link2,
  MonitorSmartphone,
  UserRound,
  UserRoundCog,
  Palette,
  Sparkles,
} as const;

describe('WX-810: Settings Section Iconography & Visual Completion Specification', () => {
  describe('1. Canonical Section Iconography Mappings', () => {
    it('defines semantic icon mappings for all Security surfaces', () => {
      const { passwordAndCredentials, activeSessions } =
        SETTINGS_SECTION_ICONOGRAPHY_MAPPING;

      assert.equal(passwordAndCredentials.iconName, 'KeyRound');
      assert.equal(passwordAndCredentials.section, 'security');
      assert.equal(passwordAndCredentials.containerSizePx, 32);
      assert.equal(passwordAndCredentials.glyphSizePx, 16);

      assert.equal(activeSessions.iconName, 'MonitorSmartphone');
      assert.equal(activeSessions.section, 'security');
      assert.equal(activeSessions.containerSizePx, 32);
      assert.equal(activeSessions.glyphSizePx, 16);
    });

    it('defines semantic icon mappings for all Account surfaces', () => {
      const { accountProfile, accountLifecycle } = SETTINGS_SECTION_ICONOGRAPHY_MAPPING;

      assert.equal(accountProfile.iconName, 'UserRound');
      assert.equal(accountProfile.section, 'account');
      assert.equal(accountProfile.containerSizePx, 32);
      assert.equal(accountProfile.glyphSizePx, 16);

      assert.equal(accountLifecycle.iconName, 'UserRoundCog');
      assert.equal(accountLifecycle.section, 'account');
      assert.equal(accountLifecycle.containerSizePx, 32);
      assert.equal(accountLifecycle.glyphSizePx, 16);
    });

    it('defines semantic icon mappings for all Appearance surfaces', () => {
      const { interfaceTheme, motionAccessibility } = SETTINGS_SECTION_ICONOGRAPHY_MAPPING;

      assert.equal(interfaceTheme.iconName, 'Palette');
      assert.equal(interfaceTheme.section, 'appearance');
      assert.equal(interfaceTheme.containerSizePx, 32);
      assert.equal(interfaceTheme.glyphSizePx, 16);

      assert.equal(motionAccessibility.iconName, 'Sparkles');
      assert.equal(motionAccessibility.section, 'appearance');
      assert.equal(motionAccessibility.containerSizePx, 32);
      assert.equal(motionAccessibility.glyphSizePx, 16);
    });
  });

  describe('2. Design System & Icon Container Geometry Constraints', () => {
    it('enforces uniform 32px container and 16px glyph across all mapped sections', () => {
      for (const [key, mapping] of Object.entries(SETTINGS_SECTION_ICONOGRAPHY_MAPPING)) {
        assert.equal(
          mapping.containerSizePx,
          32,
          `${key} container size must equal exactly 32px`,
        );
        assert.equal(
          mapping.glyphSizePx,
          16,
          `${key} glyph size must equal canonical default 16px`,
        );
        assert.equal(mapping.visualRole, 'identity');
      }
    });

    it('resolves every mapped section icon with canonical 16px size and without stroke: undefined', () => {
      for (const [key, mapping] of Object.entries(SETTINGS_SECTION_ICONOGRAPHY_MAPPING)) {
        const iconComponent = ICON_MAP[mapping.iconName as keyof typeof ICON_MAP];
        assert.ok(iconComponent, `Icon component for ${mapping.iconName} must exist in lucide-react`);

        const resolved = resolveIconProps({
          icon: iconComponent,
          size: 'default',
        });

        assert.equal(resolved.size, 16, `${key} resolved size must be 16px`);
        assert.equal(resolved.strokeWidth, 1.75, `${key} resolved strokeWidth must be 1.75`);
        assert.equal('stroke' in resolved, false, `${key} stroke must NOT be undefined property`);
        assert.equal('color' in resolved, false, `${key} color must NOT be undefined property`);
        assert.equal(resolved['aria-hidden'], true, `${key} must be marked aria-hidden`);
      }
    });
  });

  describe('3. P0/P1 Invariants Certification', () => {
    it('certifies all 10 canonical iconography invariants', () => {
      assert.equal(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.length, 10);
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_BEHAVIORAL_REGRESSION'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_NEW_DESIGN_TOKEN_SYSTEM'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_NEW_ICON_DEPENDENCY_WITHOUT_JUSTIFICATION'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_COLORFUL_DASHBOARD_TREATMENT'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_ACCESSIBILITY_REGRESSION'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_INFORMATION_ARCHITECTURE_CHANGE'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_SETTINGS_CONTRACT_CHANGE'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('NO_MOCKED_OR_FAKE_UI_STATE'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('ICONOGRAPHY_REMAINS_CONSISTENT'));
      assert.ok(SETTINGS_ICONOGRAPHY_HARD_INVARIANTS.includes('RESPONSIVE_LAYOUT_REMAINS_INTACT'));
    });
  });
});
