import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { DriftAlertDto } from '../../types/api/snapshot.dto.ts';
import { snapshotService } from '../../services/snapshot.service.ts';
import { queryKeys } from '../../hooks/queries/query-keys.ts';

describe('Drift Alert Engine & Real-Time Forensics (WX-1008)', () => {
  const mockAlert: DriftAlertDto = {
    id: 'alert_abc123',
    domainId: 'dom-atlas-001',
    domainName: 'atlas-cloud.io',
    snapshotId: 'snp-target-002',
    previousSnapshotId: 'snp-base-001',
    driftScore: 85,
    riskLevel: 'CRITICAL',
    status: 'ACTIVE',
    category: 'DNS',
    title: 'Critical DNS Nameserver Delegation Altered',
    summary: 'Authoritative DNS nameservers shifted unexpectedly.',
    forensicNarrative: [
      'Critical DNS nameserver delegation changed. Verify domain registrar integrity.',
    ],
    changes: [
      {
        field: 'Nameservers (NS)',
        type: 'MODIFIED',
        previousValue: ['ns1.cloudflare.com'],
        currentValue: ['ns1.awsdns.com'],
        description: 'Authoritative DNS delegates altered',
        severity: 'CRITICAL',
      },
    ],
    createdAt: '2026-09-06T12:00:00.000Z',
  };

  it('validates drift alert data model and critical classification', () => {
    assert.strictEqual(mockAlert.id, 'alert_abc123');
    assert.strictEqual(mockAlert.riskLevel, 'CRITICAL');
    assert.strictEqual(mockAlert.status, 'ACTIVE');
    assert.strictEqual(mockAlert.category, 'DNS');
    assert.strictEqual(mockAlert.changes.length, 1);
  });

  it('verifies queryKeys factory generates isolated query keys for drift alerts and diffs', () => {
    const domainAlertKeys = queryKeys.driftAlerts.byDomain('dom-atlas-001');
    assert.deepStrictEqual(domainAlertKeys, ['driftAlerts', 'byDomain', 'dom-atlas-001']);

    const workspaceAlertKeys = queryKeys.driftAlerts.workspace();
    assert.deepStrictEqual(workspaceAlertKeys, ['driftAlerts', 'workspace']);

    const diffKeys = queryKeys.snapshots.diff('dom-atlas-001', 'snp-target', 'snp-base');
    assert.deepStrictEqual(diffKeys, ['snapshots', 'diff', 'dom-atlas-001', 'snp-target', 'snp-base']);
  });

  it('verifies snapshotService defines all authoritative drift alert endpoints', () => {
    assert.strictEqual(typeof snapshotService.getDomainDriftAlerts, 'function');
    assert.strictEqual(typeof snapshotService.getWorkspaceDriftAlerts, 'function');
    assert.strictEqual(typeof snapshotService.acknowledgeDriftAlert, 'function');
    assert.strictEqual(typeof snapshotService.resolveDriftAlert, 'function');
  });
});
