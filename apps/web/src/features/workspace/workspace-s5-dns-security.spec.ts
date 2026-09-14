import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  S5_DNS_SECURITY_INVARIANTS,
  evaluateClientDnsSecurity,
} from './contracts/dns-security.contract.ts';

describe('S5 — DNS Security Posture & Mail Authentication Intelligence (Frontend Contract)', () => {
  it('certifies all S5 DNS and mail security frozen invariants', () => {
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_DNS_MAIL_SECURITY_INTEGRITY, true);
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_SPF_PERMISSIVE_QUALIFIER_DETECTION, true);
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_DMARC_ENFORCEMENT_POLICY_DETECTION, true);
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_DANGLING_CNAME_TAKEOVER_AUDIT, true);
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_FAILED_LOOKUP_TRUTH_PRESERVATION, true);
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_ANTI_OVERREACH_ENFORCEMENT, true);
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE, true);
    assert.equal(S5_DNS_SECURITY_INVARIANTS.S5_CROSS_SURFACE_CONSISTENCY, true);
  });

  it('correctly evaluates hardened SPF and DMARC enforcement', () => {
    const res = evaluateClientDnsSecurity(
      ['v=spf1 include:_spf.google.com -all'],
      ['v=DMARC1; p=reject; rua=mailto:sec@corp.com'],
      [],
      ['1.2.3.4'],
      true,
    );

    assert.equal(res.hasSpf, true);
    assert.equal(res.spfQualifier, 'HARDFFAIL_ALL');
    assert.equal(res.isSpfPermissive, false);
    assert.equal(res.hasDmarc, true);
    assert.equal(res.dmarcPolicy, 'REJECT');
    assert.equal(res.isDmarcEnforced, true);
    assert.equal(res.danglingCnameDetected, false);
    assert.equal(res.securityScore, 100);
  });

  it('flags permissive SPF and monitoring-only DMARC', () => {
    const res = evaluateClientDnsSecurity(
      ['v=spf1 +all'],
      ['v=DMARC1; p=none'],
      [],
      ['1.2.3.4'],
      true,
    );

    assert.equal(res.hasSpf, true);
    assert.equal(res.isSpfPermissive, true);
    assert.equal(res.spfQualifier, 'PASS_ALL');
    assert.equal(res.hasDmarc, true);
    assert.equal(res.isDmarcMonitoringOnly, true);
    assert.equal(res.securityScore < 100, true);
  });

  it('detects dangling CNAME pointing to unclaimed GitHub Pages', () => {
    const res = evaluateClientDnsSecurity(
      ['v=spf1 -all'],
      ['v=DMARC1; p=quarantine'],
      ['subdomain.github.io'],
      [], // No active A record
      false, // Unreachable
    );

    assert.equal(res.danglingCnameDetected, true);
    assert.equal(res.danglingProvider, 'GitHub Pages');
    assert.equal(res.securityScore < 70, true);
  });
});
