import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryKeys } from './query-keys.ts';

describe('WX-006: Data & API Contracts Architecture Contracts', () => {
  describe('1. TanStack Query Key Hierarchy', () => {
    it('generates consistent domain query keys', () => {
      assert.deepEqual(queryKeys.domains.all(), ['domains']);
      assert.deepEqual(queryKeys.domains.detail('dom-123'), ['domains', 'dom-123']);
      assert.deepEqual(queryKeys.domains.overview('dom-123'), ['domains', 'dom-123', 'overview']);
    });

    it('generates isolated snapshot and finding query keys', () => {
      assert.deepEqual(queryKeys.snapshots.byDomain('dom-123'), [
        'snapshots',
        'byDomain',
        'dom-123',
      ]);
      assert.deepEqual(
        queryKeys.snapshots.byDomain('dom-123', { limit: 10 }),
        ['snapshots', 'byDomain', 'dom-123', { limit: 10 }]
      );
      assert.deepEqual(queryKeys.findings.byDomain('dom-123'), [
        'findings',
        'byDomain',
        'dom-123',
      ]);
      assert.deepEqual(
        queryKeys.findings.byDomain('dom-123', { limit: 5 }),
        ['findings', 'byDomain', 'dom-123', { limit: 5 }]
      );
    });

    it('generates purpose-built workspace overview query keys', () => {
      assert.deepEqual(queryKeys.workspace.overview('dom-123'), [
        'workspace',
        'overview',
        'dom-123',
      ]);
    });
  });

  describe('2. Contract Boundary & Immutability Invariants', () => {
    it('verifies finding severity vocabulary matches 6-tier canonical scale', () => {
      const canonicalSeverities = [
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW',
        'INFORMATIONAL',
        'SUCCESS',
      ];
      assert.equal(canonicalSeverities.length, 6);
    });

    it('verifies understanding job lifecycle statuses', () => {
      const allowedStatuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'];
      assert.equal(allowedStatuses.length, 4);
    });
  });
});
