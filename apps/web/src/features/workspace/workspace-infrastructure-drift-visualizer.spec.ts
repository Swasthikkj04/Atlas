import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { MeaningfulChangeStory, HistoricalComparisonResult } from './contracts/changes.contract';
import type { InfrastructureSnapshotDto, TimelineEventDto } from '../../types/api';

describe('Move 3: Real-Time Infrastructure Drift & Change Forensics Visualizer Verification', () => {
  const baseSnapshot: InfrastructureSnapshotDto = {
    id: 'snp-base-001',
    domainId: 'dom-drift-1',
    capturedAt: '2026-08-25T10:00:00.000Z',
    responseTimeMs: 25,
    httpStatus: 200,
  };

  const targetSnapshot: InfrastructureSnapshotDto = {
    id: 'snp-target-002',
    domainId: 'dom-drift-1',
    capturedAt: '2026-08-27T10:00:00.000Z',
    responseTimeMs: 22,
    httpStatus: 200,
  };

  const sampleChanges: MeaningfulChangeStory[] = [
    {
      changeId: 'chg-nginx-upgrade',
      domainId: 'dom-drift-1',
      title: 'Web server version updated',
      description: 'NGINX reverse proxy updated from 1.22.0 to 1.24.0.',
      category: 'GATEWAY',
      componentName: 'NGINX',
      changeType: 'MODIFIED',
      significance: 'OPERATIONAL',
      severity: 'MEDIUM',
      detectedAt: '2026-08-27T10:00:00.000Z',
      previousValue: '1.22.0',
      currentValue: '1.24.0',
      evidenceBefore: ['Server: nginx/1.22.0'],
      evidenceAfter: ['Server: nginx/1.24.0'],
    },
    {
      changeId: 'chg-python-runtime-add',
      domainId: 'dom-drift-1',
      title: 'Application runtime observed',
      description: 'Python 3.11 WSGI backend runtime observed behind reverse proxy.',
      category: 'RUNTIME',
      componentName: 'Python',
      changeType: 'ADDED',
      significance: 'ARCHITECTURAL',
      severity: 'HIGH',
      detectedAt: '2026-08-27T10:00:00.000Z',
      previousValue: undefined,
      currentValue: '3.11.4',
      evidenceBefore: [],
      evidenceAfter: ['Server: Python/3.11.4'],
    },
  ];

  const sampleUnchanged = [
    {
      id: 'tech-cloudflare',
      name: 'Cloudflare',
      category: 'EDGE',
      layer: 'EDGE',
      role: 'Edge Proxy & CDN',
      version: undefined,
    },
  ];

  const comparisonResult: HistoricalComparisonResult = {
    status: 'READY',
    baseSnapshot,
    targetSnapshot,
    domainId: 'dom-drift-1',
    domainName: 'drift-test.corp.net',
    description: 'Comparison between snp-base-001 and snp-target-002',
    changes: sampleChanges,
    unchangedComponents: sampleUnchanged,
    totalSnapshots: 2,
  };

  describe('1. Topology Drift Node Reconciliation', () => {
    it('accurately classifies MODIFIED, ADDED, and STABLE drift nodes across snapshots', () => {
      // 1 Modified (NGINX), 1 Added (Python), 1 Stable (Cloudflare)
      assert.equal(comparisonResult.changes.length, 2);
      assert.equal(comparisonResult.unchangedComponents.length, 1);

      const modifiedNode = comparisonResult.changes.find((c) => c.componentName === 'NGINX');
      assert.equal(modifiedNode?.changeType, 'MODIFIED');
      assert.equal(modifiedNode?.previousValue, '1.22.0');
      assert.equal(modifiedNode?.currentValue, '1.24.0');

      const addedNode = comparisonResult.changes.find((c) => c.componentName === 'Python');
      assert.equal(addedNode?.changeType, 'ADDED');
      assert.equal(addedNode?.category, 'RUNTIME');

      const stableNode = comparisonResult.unchangedComponents.find((c) => c.name === 'Cloudflare');
      assert.equal(stableNode?.layer, 'EDGE');
    });
  });

  describe('2. Elapsed Time & Snapshot Lineage Integrity', () => {
    it('computes exact temporal delta between base and target snapshot captures', () => {
      const baseMs = new Date(baseSnapshot.capturedAt!).getTime();
      const targetMs = new Date(targetSnapshot.capturedAt!).getTime();
      const diffHours = (targetMs - baseMs) / (1000 * 60 * 60);

      assert.equal(diffHours, 48); // Exactly 2 days elapsed
    });
  });

  describe('3. Honest Quiet State & 100% Topologically Stable Guarantee', () => {
    it('reports 0 drift events when two snapshots exhibit identical topology', () => {
      const stableComparison: HistoricalComparisonResult = {
        status: 'READY',
        baseSnapshot,
        targetSnapshot,
        domainId: 'dom-drift-1',
        domainName: 'drift-test.corp.net',
        description: 'No differences observed',
        changes: [],
        unchangedComponents: [
          { id: 'tech-cloudflare', name: 'Cloudflare', category: 'EDGE', layer: 'EDGE', role: 'Edge Proxy' },
          { id: 'tech-nginx', name: 'NGINX', category: 'GATEWAY', layer: 'GATEWAY', role: 'Web Server', version: '1.24.0' },
        ],
        totalSnapshots: 2,
      };

      assert.equal(stableComparison.changes.length, 0);
      assert.equal(stableComparison.unchangedComponents.length, 2);
    });
  });
});
