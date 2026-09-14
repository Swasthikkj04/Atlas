import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R014_TICKET_ID,
  GX_R014_PHASE,
  GX_R014_STATUS,
  GX_R014_PRIMARY_PRINCIPLE,
  GX_R014_INVARIANTS,
  validateGuestHeaderNavConfig,
} from './gx-r014-guest-header-nav.contract.ts';

describe('GX-R014: Guest Workspace Header & Active Navigation Contract', () => {
  it('defines valid ticket metadata and status', () => {
    assert.equal(GX_R014_TICKET_ID, 'GX-R014');
    assert.equal(GX_R014_PHASE, 'Guest Experience Architecture');
    assert.equal(GX_R014_STATUS, 'FROZEN_HEADER_NAV_CONTRACT');
    assert.ok(GX_R014_PRIMARY_PRINCIPLE.includes('Calm, persistent spatial orientation'));
  });

  it('validates a compliant guest header navigation configuration', () => {
    const result = validateGuestHeaderNavConfig({
      domain: 'stripe.com',
      activeTab: 'overview',
      isEphemeral: true,
      isVerified: true,
      findingsCount: 3,
      evidenceCount: 12,
    });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('rejects an invalid configuration with empty domain and bad tab', () => {
    const result = validateGuestHeaderNavConfig({
      domain: '',
      activeTab: 'unknown_tab',
      isEphemeral: true,
      isVerified: false,
      findingsCount: -1,
      evidenceCount: -5,
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Domain cannot be empty')));
    assert.ok(result.errors.some((e) => e.includes('Active tab')));
    assert.ok(result.errors.some((e) => e.includes('Findings count')));
  });

  it('verifies all 5 core invariants are defined', () => {
    assert.equal(GX_R014_INVARIANTS.length, 5);
    assert.ok(GX_R014_INVARIANTS.some((i) => i.includes('Persistent Orientation')));
    assert.ok(GX_R014_INVARIANTS.some((i) => i.includes('Frictionless Reset')));
    assert.ok(GX_R014_INVARIANTS.some((i) => i.includes('Prominent Claim')));
    assert.ok(GX_R014_INVARIANTS.some((i) => i.includes('Animated Tab Indicator')));
    assert.ok(GX_R014_INVARIANTS.some((i) => i.includes('Keyboard Parity')));
  });
});
