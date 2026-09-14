import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  S3_FRONTEND_CERTIFIED_INVARIANTS,
  matchesDomainPattern,
  evaluateFrontendTlsIngressPosture,
} from './contracts/tls-hygiene-security.contract.ts';

describe('S3 Ingress Security Posture & TLS Hygiene (Frontend Contracts & Invariants)', () => {
  it('certifies all S3 frontend invariants', () => {
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_TLS_VERSION_HYGIENE_INTEGRITY, true);
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_CERTIFICATE_HORIZON_INTEGRITY, true);
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_SAN_COVERAGE_INTEGRITY, true);
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_HSTS_POLICY_HYGIENE_INTEGRITY, true);
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION, true);
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_ANTI_OVERREACH_ENFORCEMENT, true);
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE, true);
    assert.equal(S3_FRONTEND_CERTIFIED_INVARIANTS.S3_CROSS_SURFACE_CONSISTENCY, true);
  });

  describe('matchesDomainPattern', () => {
    it('matches exact and wildcard domains correctly', () => {
      assert.equal(matchesDomainPattern('example.com', 'example.com'), true);
      assert.equal(matchesDomainPattern('*.example.com', 'api.example.com'), true);
      assert.equal(matchesDomainPattern('*.example.com', 'nested.api.example.com'), false);
      assert.equal(matchesDomainPattern('*.example.com', 'other.com'), false);
    });
  });

  describe('evaluateFrontendTlsIngressPosture', () => {
    it('synthesizes compliant score (100) for modern TLS 1.3 + valid cert + preload HSTS', () => {
      const ssl = {
        protocol: 'TLSv1.3',
        daysRemaining: 120,
        subject: 'atlas.example.com',
        issuer: 'Let\'s Encrypt',
        subjectAltNames: ['atlas.example.com'],
      };
      const headers = {
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      };

      const posture = evaluateFrontendTlsIngressPosture('atlas.example.com', ssl, headers, true, 'snap-1');
      assert.equal(posture.overallHygieneScore, 100);
      assert.equal(posture.isCompliant, true);
      assert.equal(posture.tls?.supportsTls13, true);
      assert.equal(posture.certificate?.expiryTier, 'HEALTHY');
      assert.equal(posture.hsts?.hygieneTier, 'PRELOAD_READY');
    });

    it('penalizes deprecated TLS 1.0, short HSTS, and expiring certificates', () => {
      const ssl = {
        protocol: 'TLSv1.0',
        daysRemaining: 3,
        subject: 'legacy.example.com',
        issuer: 'DigiCert',
        subjectAltNames: ['legacy.example.com'],
      };
      const headers = {
        'strict-transport-security': 'max-age=3600',
      };

      const posture = evaluateFrontendTlsIngressPosture('legacy.example.com', ssl, headers, true, 'snap-1');
      assert.ok(posture.overallHygieneScore < 50);
      assert.equal(posture.isCompliant, false);
      assert.equal(posture.tls?.isWeakProtocol, true);
      assert.equal(posture.certificate?.expiryTier, 'URGENT_EXPIRY');
      assert.equal(posture.hsts?.hygieneTier, 'SUBOPTIMAL_MAX_AGE');
    });
  });
});
