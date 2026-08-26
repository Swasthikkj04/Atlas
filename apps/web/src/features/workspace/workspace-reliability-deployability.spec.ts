import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStartupEnvironment,
  evaluateReadinessState,
  mapDependencyFailureToSemanticState,
  RELIABILITY_HARD_INVARIANTS,
} from './contracts/reliability-deployability.contract.ts';

describe('WX-807: Reliability & Deployability Architecture Specifications', () => {
  describe('1. Production Startup Environment Validation', () => {
    it('passes validation when all required production variables are set', () => {
      const validEnv = {
        DATABASE_URL: 'postgresql://postgres:secret@db.internal:5432/atlas',
        JWT_SECRET: 'super-secure-production-jwt-token-key',
        NODE_ENV: 'production',
      };

      const result = validateStartupEnvironment(validEnv);
      assert.equal(result.isValid, true);
      assert.equal(result.missingVariables.length, 0);
    });

    it('rejects startup safely when required variables are missing (P0: NO_UNSAFE_STARTUP)', () => {
      const brokenEnv = {
        DATABASE_URL: '',
        JWT_SECRET: undefined,
        NODE_ENV: 'production',
      };

      const result = validateStartupEnvironment(brokenEnv);
      assert.equal(result.isValid, false);
      assert.ok(result.missingVariables.includes('DATABASE_URL'));
      assert.ok(result.missingVariables.includes('JWT_SECRET'));
    });
  });

  describe('2. Kubernetes Readiness Probe Under Subsystem Failure', () => {
    it('evaluates ready status (200 OK) when all critical dependencies are healthy', () => {
      const healthy = evaluateReadinessState({
        dbConnected: true,
        workerOperational: true,
        memoryHealthy: true,
      });

      assert.equal(healthy.isReady, true);
      assert.equal(healthy.httpStatus, 200);
      assert.equal(healthy.failedDependencies.length, 0);
    });

    it('rejects traffic with 503 Service Unavailable when Database or Worker is unhealthy (P0: NO_FALSE_READINESS)', () => {
      const dbDown = evaluateReadinessState({
        dbConnected: false,
        workerOperational: true,
        memoryHealthy: true,
      });
      assert.equal(dbDown.isReady, false);
      assert.equal(dbDown.httpStatus, 503);
      assert.ok(dbDown.failedDependencies.includes('POSTGRESQL_UNAVAILABLE'));

      const workerDead = evaluateReadinessState({
        dbConnected: true,
        workerOperational: false,
        memoryHealthy: true,
      });
      assert.equal(workerDead.isReady, false);
      assert.equal(workerDead.httpStatus, 503);
      assert.ok(workerDead.failedDependencies.includes('WORKER_UNAVAILABLE'));
    });
  });

  describe('3. Dependency Failure to Honest UX Semantic State Mapping', () => {
    it('maps foreign domain requests to UNAVAILABLE', () => {
      const state = mapDependencyFailureToSemanticState({
        dependency: 'DNS',
        hasExistingBaseline: false,
        isForeignDomain: true,
      });
      assert.equal(state, 'UNAVAILABLE');
    });

    it('maps database or authentication outages to ERROR', () => {
      const state = mapDependencyFailureToSemanticState({
        dependency: 'DATABASE',
        hasExistingBaseline: true,
      });
      assert.equal(state, 'ERROR');
    });

    it('maps partial discovery with existing baseline to PARTIAL', () => {
      const state = mapDependencyFailureToSemanticState({
        dependency: 'TLS',
        hasExistingBaseline: true,
      });
      assert.equal(state, 'PARTIAL');
    });
  });

  describe('4. P0 Reliability Hard Invariants Certification', () => {
    it('certifies all 10 canonical reliability hard invariants', () => {
      assert.equal(RELIABILITY_HARD_INVARIANTS.length, 10);
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_SILENT_DEPENDENCY_FAILURE'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_STUCK_UNDERSTANDING_JOB'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_TRUSTED_STATE_CORRUPTION_ON_FAILURE'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_DATABASE_FAILURE_DATA_CORRUPTION'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_UNBOUNDED_EXTERNAL_OPERATION'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_UNSAFE_STARTUP'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_FALSE_READINESS'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_UNSAFE_SHUTDOWN'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_MIGRATION_DATA_LOSS'));
      assert.ok(RELIABILITY_HARD_INVARIANTS.includes('NO_UNSAFE_ROLLBACK'));
    });
  });
});
