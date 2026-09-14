import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNDERSTANDING_UI_STAGES,
  resolveStageVisualStatus,
  calculateElapsedSeconds,
} from './contracts/understanding-stepper.contract';
import type { UnderstandingJobDto } from '../../types/api/understanding.dto';

describe('Authoritative Understanding Pipeline Stepper & Progress Tracking', () => {
  describe('1. Pipeline Stage Definition & Monotonic Integrity', () => {
    it('defines exactly 6 authoritative pipeline stages matching the backend engine', () => {
      assert.strictEqual(UNDERSTANDING_UI_STAGES.length, 6);
      assert.deepStrictEqual(
        UNDERSTANDING_UI_STAGES.map((s) => s.stage),
        [
          'PROBING_DNS_NETWORK',
          'ANALYZING_TLS_SECURITY',
          'BEHAVIORAL_FINGERPRINTING',
          'PERSISTING_SNAPSHOT_DIFF',
          'EVALUATING_FINDINGS_ANOMALIES',
          'SYNTHESIZING_BRIEF',
        ]
      );
    });

    it('ensures stage indices are strictly monotonic 1 through 6', () => {
      UNDERSTANDING_UI_STAGES.forEach((stageDef, idx) => {
        assert.strictEqual(stageDef.stageIndex, idx + 1);
      });
    });
  });

  describe('2. Truthful Stage Visual Status Resolution', () => {
    it('marks all stages as COMPLETED when job status is COMPLETED', () => {
      UNDERSTANDING_UI_STAGES.forEach((stageDef) => {
        const visualStatus = resolveStageVisualStatus(stageDef, undefined, 'COMPLETED');
        assert.strictEqual(visualStatus, 'completed');
      });
    });

    it('marks earlier stages as COMPLETED, current stage as ACTIVE, and future stages as PENDING during stage 3 (BEHAVIORAL_FINGERPRINTING)', () => {
      const activeProgress = {
        currentStage: 'BEHAVIORAL_FINGERPRINTING' as const,
        stageLabel: 'Deep Behavioral Fingerprinting',
        stageDetails: 'Extracting behavioral wire signatures, serverless edge markers, and framework evidence',
        stageIndex: 3,
        totalStages: 6,
        completedStages: ['PROBING_DNS_NETWORK' as const, 'ANALYZING_TLS_SECURITY' as const],
        startedAt: Date.now() - 5000,
      };

      const stage1 = UNDERSTANDING_UI_STAGES[0]; // PROBING_DNS_NETWORK
      const stage2 = UNDERSTANDING_UI_STAGES[1]; // ANALYZING_TLS_SECURITY
      const stage3 = UNDERSTANDING_UI_STAGES[2]; // BEHAVIORAL_FINGERPRINTING
      const stage4 = UNDERSTANDING_UI_STAGES[3]; // PERSISTING_SNAPSHOT_DIFF
      const stage5 = UNDERSTANDING_UI_STAGES[4]; // EVALUATING_FINDINGS_ANOMALIES
      const stage6 = UNDERSTANDING_UI_STAGES[5]; // SYNTHESIZING_BRIEF

      assert.strictEqual(resolveStageVisualStatus(stage1, activeProgress, 'RUNNING'), 'completed');
      assert.strictEqual(resolveStageVisualStatus(stage2, activeProgress, 'RUNNING'), 'completed');
      assert.strictEqual(resolveStageVisualStatus(stage3, activeProgress, 'RUNNING'), 'active');
      assert.strictEqual(resolveStageVisualStatus(stage4, activeProgress, 'RUNNING'), 'pending');
      assert.strictEqual(resolveStageVisualStatus(stage5, activeProgress, 'RUNNING'), 'pending');
      assert.strictEqual(resolveStageVisualStatus(stage6, activeProgress, 'RUNNING'), 'pending');
    });

    it('accurately resolves FAILED stage when worker encounters failure at stage 4', () => {
      const failedProgress = {
        currentStage: 'PERSISTING_SNAPSHOT_DIFF' as const,
        stageLabel: 'Snapshot Persistence & Drift',
        stageDetails: 'Database connection terminated during snapshot write',
        stageIndex: 4,
        totalStages: 6,
        completedStages: [
          'PROBING_DNS_NETWORK' as const,
          'ANALYZING_TLS_SECURITY' as const,
          'BEHAVIORAL_FINGERPRINTING' as const,
        ],
      };

      const stage1 = UNDERSTANDING_UI_STAGES[0];
      const stage4 = UNDERSTANDING_UI_STAGES[3];
      const stage5 = UNDERSTANDING_UI_STAGES[4];

      assert.strictEqual(resolveStageVisualStatus(stage1, failedProgress, 'FAILED'), 'completed');
      assert.strictEqual(resolveStageVisualStatus(stage4, failedProgress, 'FAILED'), 'failed');
      assert.strictEqual(resolveStageVisualStatus(stage5, failedProgress, 'FAILED'), 'pending');
    });

    it('marks stage 1 as ACTIVE when job is RUNNING but progress has not yet reported', () => {
      const stage1 = UNDERSTANDING_UI_STAGES[0];
      const stage2 = UNDERSTANDING_UI_STAGES[1];

      assert.strictEqual(resolveStageVisualStatus(stage1, undefined, 'RUNNING'), 'active');
      assert.strictEqual(resolveStageVisualStatus(stage2, undefined, 'RUNNING'), 'pending');
    });
  });

  describe('3. Duration & Elapsed Time Calculation', () => {
    it('computes honest elapsed seconds from backend startedAt timestamp', () => {
      const baseNow = 1700000005000;
      const startedAt = 1700000000000; // 5000ms ago

      const elapsed = calculateElapsedSeconds(startedAt, baseNow);
      assert.strictEqual(elapsed, 5);
    });

    it('returns 0 if startedAt is missing or invalid', () => {
      assert.strictEqual(calculateElapsedSeconds(null), 0);
      assert.strictEqual(calculateElapsedSeconds(undefined), 0);
      assert.strictEqual(calculateElapsedSeconds(0), 0);
    });
  });
});
