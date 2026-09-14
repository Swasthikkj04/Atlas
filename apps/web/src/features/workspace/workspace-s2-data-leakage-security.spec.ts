import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  S2_FRONTEND_CERTIFIED_INVARIANTS,
  sanitizeFrontendLeakageEvidence,
  evaluateFrontendDataLeakage,
} from './contracts/data-leakage-security.contract.ts';

describe('S2 Data Leakage & Debug Exposure (Frontend Contracts & Invariants)', () => {
  it('certifies all S2 frontend invariants', () => {
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_DEBUG_HEADER_EXPOSURE_INTEGRITY, true);
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_INTERNAL_TOPOLOGY_LEAKAGE_INTEGRITY, true);
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_STACK_TRACE_DISCLOSURE_INTEGRITY, true);
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_SENSITIVE_VALUE_REDACTION, true);
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION, true);
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_ANTI_OVERREACH_ENFORCEMENT, true);
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE, true);
    assert.equal(S2_FRONTEND_CERTIFIED_INVARIANTS.S2_CROSS_SURFACE_CONSISTENCY, true);
  });

  describe('sanitizeFrontendLeakageEvidence (S2-001 / S2-007)', () => {
    it('masks database connection secrets and bearer tokens', () => {
      const raw =
        'Connection failed for postgres://pg_admin:my_secret_pass@10.0.1.5:5432/app with Bearer eyJhbGciOiJIUzI1NiJ9';
      const sanitized = sanitizeFrontendLeakageEvidence(raw);

      assert.equal(sanitized.includes('my_secret_pass'), false);
      assert.equal(sanitized.includes('eyJhbGciOiJIUzI1NiJ9'), false);
      assert.ok(sanitized.includes('postgres://[REDACTED]:[REDACTED]@10.0.1.5:5432/app'));
      assert.ok(sanitized.includes('Bearer [REDACTED]'));
    });
  });

  describe('evaluateFrontendDataLeakage (S2-002, S2-003, S2-004)', () => {
    it('evaluates debug header and internal RFC 1918 IP leakage', () => {
      const headers = {
        'x-debug-token': 'dbg-99120',
        'x-backend-server': '10.240.1.12:8080',
      };

      const assessment = evaluateFrontendDataLeakage(headers, undefined, 'snap-1');
      assert.equal(assessment.totalFindings, 2);
      assert.equal(assessment.isHardened, false);
      assert.equal(assessment.debugHeaderFindings.length, 1);
      assert.equal(assessment.internalTopologyFindings.length, 1);
    });

    it('evaluates stack trace disclosure in error response body', () => {
      const body = 'TypeError: Cannot read properties of undefined in /app/index.js:10';
      const assessment = evaluateFrontendDataLeakage(undefined, body, 'snap-1');
      assert.equal(assessment.totalFindings, 1);
      assert.equal(assessment.stackTraceFindings.length, 1);
      assert.equal(assessment.stackTraceFindings[0].severity, 'HIGH');
    });

    it('returns hardened assessment when no diagnostic leakage is detected', () => {
      const headers = {
        'server': 'cloudflare',
        'content-type': 'application/json',
      };
      const assessment = evaluateFrontendDataLeakage(headers, '{"status":"ok"}', 'snap-1');
      assert.equal(assessment.totalFindings, 0);
      assert.equal(assessment.isHardened, true);
    });
  });
});
