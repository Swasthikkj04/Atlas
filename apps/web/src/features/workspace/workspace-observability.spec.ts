import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStructuredLog,
  validateHealthProbeSemantics,
  OBSERVABILITY_HARD_INVARIANTS,
} from './contracts/observability.contract.ts';

describe('WX-805: Observability & Operational Telemetry Architecture Specifications', () => {
  describe('1. Structured Logging & Correlation ID Tracing', () => {
    it('creates structured operational log events with valid timestamps and correlation IDs', () => {
      const log = createStructuredLog({
        level: 'INFO',
        correlationId: 'corr_obs_91823',
        operation: 'UNDERSTANDING_EXECUTION',
        event: 'JOB_STARTED',
        domainId: 'dom-stripe-prod',
        jobId: 'job-1029',
      });

      assert.equal(log.level, 'INFO');
      assert.equal(log.correlationId, 'corr_obs_91823');
      assert.equal(log.operation, 'UNDERSTANDING_EXECUTION');
      assert.equal(log.event, 'JOB_STARTED');
      assert.equal(log.domainId, 'dom-stripe-prod');
      assert.equal(log.jobId, 'job-1029');
      assert.ok(log.timestamp);
    });

    it('sanitizes metadata and prevents secret leakage into log payload', () => {
      const log = createStructuredLog({
        level: 'ERROR',
        correlationId: 'corr_sec_leak_prevent',
        operation: 'TLS_DISCOVERY',
        event: 'HANDSHAKE_TIMEOUT',
        domainId: 'dom-stripe-prod',
        durationMs: 5000,
        metadata: {
          retryCount: 3,
          tlsVersion: 'TLSv1.3',
        },
      });

      assert.equal(log.level, 'ERROR');
      assert.equal(log.durationMs, 5000);
      assert.equal(log.metadata?.retryCount, 3);
    });
  });

  describe('2. Health vs Readiness Probe Semantics', () => {
    it('verifies /health/live checks only process liveness without checking database dependencies', () => {
      const live = validateHealthProbeSemantics('live');
      assert.equal(live.checksDependencies, false);
      assert.equal(live.probeTarget, '/api/v1/health/live');
    });

    it('verifies /health/ready evaluates critical dependencies before accepting production traffic', () => {
      const ready = validateHealthProbeSemantics('ready');
      assert.equal(ready.checksDependencies, true);
      assert.equal(ready.probeTarget, '/api/v1/health/ready');
    });
  });

  describe('3. P0 Observability Hard Invariants Certification', () => {
    it('certifies all 10 canonical observability hard invariants', () => {
      assert.equal(OBSERVABILITY_HARD_INVARIANTS.length, 10);
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_UNTRACEABLE_PRODUCTION_FAILURE'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_UNCORRELATED_API_ERROR'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_SILENT_WORKER_FAILURE'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_SENSITIVE_LOG_PAYLOAD'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_SECRET_LOGGING'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_RAW_CUSTOMER_PAYLOAD_LOGGING'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_DUPLICATE_OBSERVABILITY_SYSTEM'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_HEALTH_READINESS_SEMANTIC_COLLAPSE'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_LOSS_OF_JOB_FAILURE_CONTEXT'));
      assert.ok(OBSERVABILITY_HARD_INVARIANTS.includes('NO_OPERATIONAL_TELEMETRY_TENANT_LEAKAGE'));
    });
  });
});
