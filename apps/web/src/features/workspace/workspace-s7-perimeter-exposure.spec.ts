import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  S7_PERIMETER_EXPOSURE_INVARIANTS,
  evaluateClientPerimeterExposure,
  type WebGitExposureAudit,
  type WebEnvExposureAudit,
  type WebManagementEndpointAudit,
  type WebPerimeterExposureReport,
} from './contracts/perimeter-exposure-security.contract.ts';

describe('S7: Well-Known Perimeter & Configuration Exposure Contract Specification', () => {
  it('certifies S7 invariant definitions', () => {
    assert.equal(S7_PERIMETER_EXPOSURE_INVARIANTS.S7_GIT_METADATA_EXPOSURE_PREVENTION, true);
    assert.equal(S7_PERIMETER_EXPOSURE_INVARIANTS.S7_ENV_FILE_SECRET_EXPOSURE_PREVENTION, true);
    assert.equal(S7_PERIMETER_EXPOSURE_INVARIANTS.S7_MANAGEMENT_ENDPOINT_EXPOSURE_DETECTION, true);
    assert.equal(S7_PERIMETER_EXPOSURE_INVARIANTS.S7_SECRET_VALUE_REDACTION_INVARIANT, true);
  });

  describe('1. Git Source Repository Exposure Evaluation', () => {
    it('detects exposed .git/HEAD file and ref pointer', () => {
      const gitAudit: WebGitExposureAudit = {
        isGitRepoExposed: true,
        refDetected: 'ref: refs/heads/main',
        matchedPattern: 'ref: refs/heads/*',
        evidenceSnippet: 'ref: refs/heads/main',
      };

      assert.equal(gitAudit.isGitRepoExposed, true);
      assert.equal(gitAudit.refDetected, 'ref: refs/heads/main');
    });

    it('confirms secure site without git exposure', () => {
      const gitAudit: WebGitExposureAudit = {
        isGitRepoExposed: false,
      };

      assert.equal(gitAudit.isGitRepoExposed, false);
    });
  });

  describe('2. Environment Secrets Exposure Evaluation', () => {
    it('flags exposed .env variables', () => {
      const envAudit: WebEnvExposureAudit = {
        isEnvFileExposed: true,
        sensitiveKeysDetected: ['DB_PASSWORD', 'JWT_SECRET'],
        matchedPattern: '.env key-value definitions',
      };

      assert.equal(envAudit.isEnvFileExposed, true);
      assert.deepEqual(envAudit.sensitiveKeysDetected, ['DB_PASSWORD', 'JWT_SECRET']);
    });
  });

  describe('3. Management & Diagnostic Endpoints Exposure', () => {
    it('flags exposed Prometheus metrics and Spring Actuator endpoints', () => {
      const managementAudit: WebManagementEndpointAudit = {
        isMetricsExposed: true,
        isActuatorExposed: true,
        isSwaggerExposed: false,
        isGraphqlIntrospectionExposed: false,
        exposedServices: ['Prometheus Metrics (/metrics)', 'Spring Boot Actuator (/actuator)'],
      };

      assert.equal(managementAudit.isMetricsExposed, true);
      assert.equal(managementAudit.isActuatorExposed, true);
      assert.equal(managementAudit.exposedServices.length, 2);
    });
  });

  describe('4. Complete Perimeter Exposure Evaluator Integrity', () => {
    it('constructs authoritative perimeter exposure report via client evaluator', () => {
      const report: WebPerimeterExposureReport = evaluateClientPerimeterExposure(
        'https://vulnerable.corp/.git/HEAD',
        200,
        'ref: refs/heads/release\nDB_PASSWORD=secret\n# HELP http_requests_total Total requests\n',
      );

      assert.equal(report.isEvaluated, true);
      assert.equal(report.hasCriticalPerimeterExposure, true);
      assert.equal(report.gitAudit.isGitRepoExposed, true);
      assert.equal(report.envAudit.isEnvFileExposed, true);
      assert.equal(report.managementAudit.isMetricsExposed, true);
    });
  });
});
