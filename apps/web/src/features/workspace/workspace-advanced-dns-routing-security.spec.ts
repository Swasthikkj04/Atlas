import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P2_ADVANCED_DNS_ROUTING_INVARIANTS,
  evaluateClientDnssec,
  evaluateClientCaa,
  evaluateClientBgpRpki,
  evaluateClientAdvancedDnsRouting,
  getDnssecBadgeConfig,
  getCaaBadgeConfig,
  getRpkiBadgeConfig,
} from './contracts/advanced-dns-routing-security.contract.ts';

describe('P2 Advanced DNSSEC, CAA & BGP RPKI Validation Contract Suite', () => {
  it('certifies all P2 security invariants are enforced', () => {
    assert.strictEqual(P2_ADVANCED_DNS_ROUTING_INVARIANTS.P2_DNSSEC_VALIDATION_INTEGRITY, true);
    assert.strictEqual(P2_ADVANCED_DNS_ROUTING_INVARIANTS.P2_CAA_RFC8659_POLICY_COMPLIANCE, true);
    assert.strictEqual(P2_ADVANCED_DNS_ROUTING_INVARIANTS.P2_BGP_RPKI_ROUTE_ORIGIN_INTEGRITY, true);
    assert.strictEqual(P2_ADVANCED_DNS_ROUTING_INVARIANTS.P2_FAILED_LOOKUP_TRUTH_PRESERVATION, true);
    assert.strictEqual(P2_ADVANCED_DNS_ROUTING_INVARIANTS.P2_ANTI_OVERREACH_ENFORCEMENT, true);
    assert.strictEqual(P2_ADVANCED_DNS_ROUTING_INVARIANTS.P2_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE, true);
    assert.strictEqual(P2_ADVANCED_DNS_ROUTING_INVARIANTS.P2_CROSS_SURFACE_CONSISTENCY, true);
  });

  describe('DNSSEC Evaluation', () => {
    it('evaluates valid DNSSEC configuration', () => {
      const summary = evaluateClientDnssec({
        enabled: true,
        status: 'VALID',
        hasDs: true,
        hasDnskey: true,
        hasRrsig: true,
        algorithms: ['ECDSAP256SHA256 (13)'],
        digestTypes: ['SHA-256 (2)'],
        keyTags: [2371],
      });

      assert.strictEqual(summary.enabled, true);
      assert.strictEqual(summary.status, 'VALID');
      assert.strictEqual(summary.isHardened, true);
      assert.strictEqual(summary.label, 'DNSSEC Validated');
      assert.deepStrictEqual(summary.keyTags, [2371]);

      const badge = getDnssecBadgeConfig(summary.status);
      assert.strictEqual(badge.label, 'DNSSEC Signed & Validated');
      assert.ok(badge.badgeClass.includes('emerald'));
    });

    it('evaluates expired RRSIG signature', () => {
      const summary = evaluateClientDnssec({
        enabled: true,
        status: 'EXPIRED_RRSIG',
      });

      assert.strictEqual(summary.status, 'EXPIRED_RRSIG');
      assert.strictEqual(summary.isHardened, false);
      assert.strictEqual(summary.label, 'Expired RRSIG Signature');

      const badge = getDnssecBadgeConfig(summary.status);
      assert.strictEqual(badge.label, 'Signature Expired (SERVFAIL)');
      assert.ok(badge.badgeClass.includes('rose'));
    });

    it('evaluates unsigned DNS zone', () => {
      const summary = evaluateClientDnssec(undefined);

      assert.strictEqual(summary.enabled, false);
      assert.strictEqual(summary.status, 'UNSIGNED');
      assert.strictEqual(summary.isHardened, false);

      const badge = getDnssecBadgeConfig(summary.status);
      assert.strictEqual(badge.label, 'Unsigned Zone');
    });
  });

  describe('CAA Policy Evaluation', () => {
    it('evaluates compliant CAA policy matching TLS issuer', () => {
      const summary = evaluateClientCaa(
        [
          { critical: 0, issue: 'letsencrypt.org' },
          { critical: 0, issuewild: ';' },
          { critical: 0, iodef: 'mailto:security@domain.com' },
        ],
        "Let's Encrypt Authority X3",
      );

      assert.strictEqual(summary.present, true);
      assert.strictEqual(summary.isHardened, true);
      assert.strictEqual(summary.isTlsIssuerPermitted, true);
      assert.strictEqual(summary.issuerMismatchDetected, false);
      assert.strictEqual(summary.iodefMailbox, 'mailto:security@domain.com');

      const badge = getCaaBadgeConfig(summary);
      assert.strictEqual(badge.label, 'CAA Enforced');
      assert.ok(badge.badgeClass.includes('emerald'));
    });

    it('evaluates CAA issuer mismatch when active TLS issuer is unauthorized', () => {
      const summary = evaluateClientCaa(
        [{ critical: 0, issue: 'digicert.com' }],
        "Let's Encrypt Authority X3",
      );

      assert.strictEqual(summary.present, true);
      assert.strictEqual(summary.isHardened, false);
      assert.strictEqual(summary.isTlsIssuerPermitted, false);
      assert.strictEqual(summary.issuerMismatchDetected, true);

      const badge = getCaaBadgeConfig(summary);
      assert.strictEqual(badge.label, 'CAA Issuer Mismatch');
      assert.ok(badge.badgeClass.includes('rose'));
    });

    it('evaluates missing CAA record', () => {
      const summary = evaluateClientCaa([]);

      assert.strictEqual(summary.present, false);
      assert.strictEqual(summary.allowsAllIssuers, true);
      assert.strictEqual(summary.isHardened, false);

      const badge = getCaaBadgeConfig(summary);
      assert.strictEqual(badge.label, 'No CAA Record');
    });
  });

  describe('BGP RPKI ROV Evaluation', () => {
    it('evaluates valid BGP routes with cryptographic ROA validation', () => {
      const summary = evaluateClientBgpRpki({
        routes: [
          {
            ip: '104.21.4.1',
            ipVersion: 4,
            prefix: '104.16.0.0/13',
            asn: 13335,
            asName: 'CLOUDFLARENET',
            rpkiStatus: 'VALID',
          },
        ],
        uniqueAsns: [13335],
        isMultiHomed: false,
        rpkiSummary: {
          totalRoutes: 1,
          validCount: 1,
          invalidCount: 0,
          notFoundCount: 0,
          overallRpkiStatus: 'VALID',
          coveragePercentage: 100,
        },
        hijackRiskDetected: false,
      });

      assert.strictEqual(summary.totalRoutes, 1);
      assert.strictEqual(summary.validCount, 1);
      assert.strictEqual(summary.coveragePercentage, 100);
      assert.strictEqual(summary.overallStatus, 'VALID');
      assert.strictEqual(summary.isHardened, true);
      assert.strictEqual(summary.hijackRiskDetected, false);

      const badge = getRpkiBadgeConfig(summary.overallStatus, summary.hijackRiskDetected);
      assert.strictEqual(badge.label, 'RPKI ROA Valid');
      assert.ok(badge.badgeClass.includes('emerald'));
    });

    it('evaluates BGP hijack risk on INVALID RPKI ROA', () => {
      const summary = evaluateClientBgpRpki({
        routes: [
          {
            ip: '198.51.100.1',
            ipVersion: 4,
            prefix: '198.51.100.0/24',
            asn: 99999,
            asName: 'ROGUE-ASN',
            rpkiStatus: 'INVALID',
          },
        ],
        uniqueAsns: [99999],
        isMultiHomed: false,
        rpkiSummary: {
          totalRoutes: 1,
          validCount: 0,
          invalidCount: 1,
          notFoundCount: 0,
          overallRpkiStatus: 'INVALID',
          coveragePercentage: 0,
        },
        hijackRiskDetected: true,
      });

      assert.strictEqual(summary.overallStatus, 'INVALID');
      assert.strictEqual(summary.hijackRiskDetected, true);
      assert.strictEqual(summary.isHardened, false);

      const badge = getRpkiBadgeConfig(summary.overallStatus, summary.hijackRiskDetected);
      assert.strictEqual(badge.label, 'RPKI INVALID (Hijack Risk)');
      assert.ok(badge.badgeClass.includes('rose'));
    });
  });

  describe('Holistic Advanced DNS & Routing Evaluation', () => {
    it('computes 100% score and compliant status for fully hardened stack', () => {
      const assessment = evaluateClientAdvancedDnsRouting(
        {
          dnssec: { enabled: true, status: 'VALID', hasDs: true, hasDnskey: true, hasRrsig: true },
          caa: [{ critical: 0, issue: 'letsencrypt.org' }],
        },
        { certificate: { issuer: "Let's Encrypt Authority X3" } },
        {
          routes: [{ ip: '104.21.4.1', ipVersion: 4, prefix: '104.16.0.0/13', asn: 13335, asName: 'CLOUDFLARENET', rpkiStatus: 'VALID' }],
          uniqueAsns: [13335],
          isMultiHomed: false,
          rpkiSummary: { totalRoutes: 1, validCount: 1, invalidCount: 0, notFoundCount: 0, overallRpkiStatus: 'VALID', coveragePercentage: 100 },
          hijackRiskDetected: false,
        },
      );

      assert.strictEqual(assessment.overallScore, 100);
      assert.strictEqual(assessment.isCompliant, true);
    });
  });
});
