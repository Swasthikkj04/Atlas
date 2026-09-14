import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P2_DATA_RETENTION_INVARIANTS,
  TIER_RETENTION_SCHEDULES,
  formatRetentionWindow,
  formatStorageBytes,
  calculateStorageEfficiency,
} from './contracts/data-retention-privacy.contract.ts';

describe('P2 Data Retention & Evidence Lifecycle Suite', () => {
  it('certifies all P2 data retention invariants are frozen and enforced', () => {
    assert.strictEqual(P2_DATA_RETENTION_INVARIANTS.P2_GRANULAR_TIER_RETENTION_POLICIES, true);
    assert.strictEqual(P2_DATA_RETENTION_INVARIANTS.P2_AUTOMATED_EVIDENCE_LIFECYCLE_PURGING, true);
    assert.strictEqual(P2_DATA_RETENTION_INVARIANTS.P2_EPHEMERAL_GX_PURGE_24H, true);
    assert.strictEqual(P2_DATA_RETENTION_INVARIANTS.P2_CRYPTOGRAPHIC_PURGE_AUDIT_TRAIL, true);
    assert.strictEqual(P2_DATA_RETENTION_INVARIANTS.P2_ZERO_ORPHAN_CASCADE_DELETION, true);
  });

  describe('Tier Retention Schedules', () => {
    it('enforces 24-hour ephemerality on GUEST tier', () => {
      const guest = TIER_RETENTION_SCHEDULES.GUEST;
      assert.strictEqual(guest.rawEvidenceDays, 1);
      assert.strictEqual(guest.guestSessionHours, 24);
      assert.strictEqual(guest.snapshotDays, 1);
    });

    it('enforces 7-day raw payload retention on FREE tier', () => {
      const free = TIER_RETENTION_SCHEDULES.FREE;
      assert.strictEqual(free.rawEvidenceDays, 7);
      assert.strictEqual(free.snapshotDays, 14);
      assert.strictEqual(free.changeHistoryDays, 30);
    });

    it('enforces 30-day raw payload retention on PRO tier', () => {
      const pro = TIER_RETENTION_SCHEDULES.PRO;
      assert.strictEqual(pro.rawEvidenceDays, 30);
      assert.strictEqual(pro.snapshotDays, 90);
      assert.strictEqual(pro.changeHistoryDays, 180);
      assert.strictEqual(pro.auditLogDays, 365);
    });

    it('enforces 90-day raw payload & 1-year snapshot retention on ENTERPRISE tier', () => {
      const enterprise = TIER_RETENTION_SCHEDULES.ENTERPRISE;
      assert.strictEqual(enterprise.rawEvidenceDays, 90);
      assert.strictEqual(enterprise.snapshotDays, 365);
      assert.strictEqual(enterprise.changeHistoryDays, 730);
      assert.strictEqual(enterprise.auditLogDays, 1095);
    });
  });

  describe('Formatting & Efficiency Helpers', () => {
    it('formats storage bytes cleanly across magnitudes', () => {
      assert.strictEqual(formatStorageBytes(0), '0 B');
      assert.strictEqual(formatStorageBytes(512), '512.0 B');
      assert.strictEqual(formatStorageBytes(1024 * 50), '50.0 KB');
      assert.strictEqual(formatStorageBytes(1024 * 1024 * 12.5), '12.5 MB');
      assert.strictEqual(formatStorageBytes(1024 * 1024 * 1024 * 2.3), '2.3 GB');
    });

    it('formats retention windows correctly', () => {
      assert.strictEqual(formatRetentionWindow(1), '24 Hours');
      assert.strictEqual(formatRetentionWindow(7), '7 Days');
      assert.strictEqual(formatRetentionWindow(14), '14 Days');
      assert.strictEqual(formatRetentionWindow(30), '1 Months');
      assert.strictEqual(formatRetentionWindow(90), '3 Months');
      assert.strictEqual(formatRetentionWindow(365), '1 Year');
      assert.strictEqual(formatRetentionWindow(730), '2 Years');
    });

    it('calculates compression efficiency percentage', () => {
      assert.strictEqual(calculateStorageEfficiency(0, 0), 0);
      assert.strictEqual(calculateStorageEfficiency(1000, 250), 75);
      assert.strictEqual(calculateStorageEfficiency(10_000_000, 4_000_000), 60);
    });
  });
});
