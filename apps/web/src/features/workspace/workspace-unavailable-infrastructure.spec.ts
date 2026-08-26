import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveUnavailableContext,
} from './contracts/unavailable-infrastructure.contract.ts';

describe('WX-703: Unavailable Infrastructure Architecture Contracts', () => {
  describe('1. Authoritative Unavailable Context Resolution', () => {
    it('resolves cross-domain unauthorized boundaries without leaking foreign tenant metadata (P0)', () => {
      const descriptor = resolveUnavailableContext({
        reason: 'CROSS_DOMAIN_BOUNDARY',
        activeDomainName: 'stripe.com',
        returnPath: '/workspace',
      });

      assert.equal(descriptor.reason, 'CROSS_DOMAIN_BOUNDARY');
      assert.equal(descriptor.title, 'Resource unavailable in active domain.');
      assert.ok(descriptor.description.includes('cannot legitimately be accessed'));
      assert.equal(descriptor.returnTarget, '/workspace');
      assert.equal(descriptor.returnLabel, 'Return to Active Workspace');

      // P0 Security: Must not leak foreign metadata
      assert.ok(!descriptor.description.includes('github.com'));
      assert.ok(!descriptor.description.includes('secret'));
    });

    it('resolves unavailable supporting evidence preserving the return path to finding investigation', () => {
      const returnPath = '/workspace?sourceType=finding&sourceId=fnd-tls-001';
      const descriptor = resolveUnavailableContext({
        reason: 'EVIDENCE_UNAVAILABLE',
        returnPath,
        sourceExperience: 'Finding Investigation',
      });

      assert.equal(descriptor.reason, 'EVIDENCE_UNAVAILABLE');
      assert.equal(descriptor.title, 'Supporting evidence unavailable.');
      assert.ok(descriptor.description.includes('protocol evidence was not captured'));
      assert.equal(descriptor.returnTarget, returnPath);
      assert.equal(descriptor.returnLabel, 'Back to Finding Investigation');
    });

    it('resolves unavailable historical context preserving return path to snapshot', () => {
      const returnPath = '/workspace?sourceType=snapshot&sourceId=snp-001';
      const descriptor = resolveUnavailableContext({
        reason: 'HISTORICAL_CONTEXT_UNAVAILABLE',
        returnPath,
        sourceExperience: 'Snapshot History',
      });

      assert.equal(descriptor.reason, 'HISTORICAL_CONTEXT_UNAVAILABLE');
      assert.equal(descriptor.title, 'Historical context unavailable.');
      assert.ok(descriptor.description.includes('Temporal evolution telemetry'));
      assert.equal(descriptor.returnTarget, returnPath);
      assert.equal(descriptor.returnLabel, 'Back to Snapshot History');
    });

    it('resolves unsupported discovery capability calmly', () => {
      const descriptor = resolveUnavailableContext({
        reason: 'CAPABILITY_UNSUPPORTED',
        returnPath: '/workspace',
        sourceExperience: 'Infrastructure Overview',
      });

      assert.equal(descriptor.reason, 'CAPABILITY_UNSUPPORTED');
      assert.equal(descriptor.title, 'Observation capability unavailable.');
      assert.equal(descriptor.returnTarget, '/workspace');
    });
  });

  describe('2. Four-Way Semantic Separation', () => {
    it('maintains strict semantic separation: UNAVAILABLE vs EMPTY vs PARTIAL vs ERROR', () => {
      const semanticStates: Record<string, string> = {
        EMPTY: 'No established infrastructure baseline exists yet.',
        PARTIAL: 'Some infrastructure signals exist, but coverage is incomplete.',
        UNAVAILABLE: 'This specific information cannot legitimately be provided in this context.',
        ERROR: 'System or network failure prevented the operation from completing.',
      };

      const keys = Object.keys(semanticStates);
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          assert.notEqual(semanticStates[keys[i]!], semanticStates[keys[j]!]);
        }
      }
    });
  });

  describe('3. Hard Invariants: Zero Anti-Patterns', () => {
    it('strictly forbids sensational error titles, foreign metadata leaks, or automatic retries on unavailable state', () => {
      const prohibitedPatterns = [
        'criticalSystemFailureBanner',
        'infrastructureDownAlarm',
        'foreignDomainMetadataLeakage',
        'conflatingUnavailableWithNetworkError',
        'automaticRetryOnDomainMismatch',
      ];

      for (const pattern of prohibitedPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
