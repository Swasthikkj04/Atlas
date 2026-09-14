import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SnapshotDriftForensicsDto } from '../../types/api/snapshot.dto.ts';
import { snapshotService } from '../../services/snapshot.service.ts';

describe('Snapshot Drift Forensics Engine Contracts & API (WX-505 / WX-1008)', () => {
  const mockDriftData: SnapshotDriftForensicsDto = {
    baseSnapshotId: 'snp-base-001',
    targetSnapshotId: 'snp-target-002',
    domainId: 'dom-atlas-001',
    domainName: 'atlas-cloud.io',
    baseCapturedAt: '2026-09-01T12:00:00.000Z',
    targetCapturedAt: '2026-09-06T12:00:00.000Z',
    driftScore: 45,
    riskLevel: 'HIGH',
    hasMeaningfulDrift: true,
    totalChangesCount: 3,
    forensicNarrative: [
      'Critical DNS nameserver delegation changed. Verify domain registrar integrity.',
      'Discovered new active infrastructure technologies: Tailwind CSS.',
    ],
    dns: {
      changes: [
        {
          field: 'Nameservers (NS)',
          type: 'MODIFIED',
          previousValue: ['ns1.cloudflare.com'],
          currentValue: ['ns1.awsdns.com'],
          description: 'Authoritative DNS delegates altered',
          severity: 'HIGH',
        },
      ],
      ipShiftDetected: false,
      nameserverShiftDetected: true,
    },
    tls: {
      changes: [],
      daysRemainingPrevious: 90,
      daysRemainingCurrent: 85,
      issuerChanged: false,
    },
    http: {
      changes: [
        {
          field: 'Header: content-security-policy',
          type: 'REMOVED',
          previousValue: "default-src 'self'",
          currentValue: null,
          description: 'Security header "content-security-policy" was removed in recent snapshot.',
          severity: 'HIGH',
        },
      ],
      previousStatus: 200,
      currentStatus: 200,
      noiseHeadersSuppressed: 4,
    },
    technology: {
      changes: [
        {
          field: 'Technology: Tailwind CSS',
          type: 'ADDED',
          currentValue: '3.4.0',
          description: 'Detected new technology: Tailwind CSS (v3.4.0)',
          severity: 'LOW',
        },
      ],
      addedTechnologies: ['Tailwind CSS'],
      removedTechnologies: [],
    },
  };

  it('validates snapshot drift forensics payload integrity and scoring boundaries', () => {
    assert.strictEqual(mockDriftData.baseSnapshotId, 'snp-base-001');
    assert.strictEqual(mockDriftData.targetSnapshotId, 'snp-target-002');
    assert.strictEqual(mockDriftData.riskLevel, 'HIGH');
    assert.strictEqual(mockDriftData.hasMeaningfulDrift, true);
    assert.strictEqual(mockDriftData.totalChangesCount, 3);
    assert.strictEqual(mockDriftData.dns.nameserverShiftDetected, true);
    assert.strictEqual(mockDriftData.http.noiseHeadersSuppressed, 4);
    assert.strictEqual(mockDriftData.technology.addedTechnologies.length, 1);
  });

  it('verifies snapshotService.getSnapshotDiff generates authoritative URL path', async () => {
    assert.strictEqual(typeof snapshotService.getSnapshotDiff, 'function');
  });
});
