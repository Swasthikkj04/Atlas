import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptAssessmentDataToGuestWorkspace,
  auditGuestWorkspaceSecurity,
  GUEST_WORKSPACE_TABS,
  GX_R013_INVARIANTS,
} from './gx-r013-guest-workspace-shell.contract.ts';
import {
  validateGuestHeaderNavConfig,
  GX_R014_INVARIANTS,
} from './gx-r014-guest-header-nav.contract.ts';
import type { AssessmentData } from '../types/index.ts';

describe('GX-R015: Master Guest Workspace Shell & Intelligence Verification Gate', () => {
  const sampleAssessmentData: AssessmentData = {
    domain: 'stripe.com',
    sessionId: 'ses_test_master_123',
    jobId: 'job_test_master_456',
    duration: 3200,
    technologies: [
      { name: 'Cloudflare', category: 'CDN', confidence: 'high' },
      { name: 'Nginx', category: 'Web Server', confidence: 'high' },
      { name: 'React', category: 'JavaScript Framework', confidence: 'medium' },
      { name: 'Amazon Web Services', category: 'Hosting', confidence: 'high' },
    ],
    dns: {
      a: ['104.18.20.19', '104.18.21.19'],
      mx: ['feedback-smtp.us-east-1.amazonses.com'],
      ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
    },
    tls: {
      version: 'TLSv1.3',
      cipher: 'TLS_AES_256_GCM_SHA384',
      issuer: "Let's Encrypt Authority X3",
      validTo: '2026-12-31T23:59:59Z',
    },
    headers: {
      server: 'cloudflare',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'content-security-policy': "default-src 'self'",
    },
    observations: [
      {
        id: 'obs-01',
        title: 'Strict-Transport-Security Preloaded',
        category: 'Transport Security',
        severity: 'INFORMATIONAL',
        description: 'HSTS is actively configured with long max-age and preload directives.',
      },
      {
        id: 'obs-02',
        title: 'Public Origin Exposure Risk',
        category: 'Perimeter Hygiene',
        severity: 'HIGH',
        description: 'Direct origin fallback detected without strict edge IP restriction.',
      },
      {
        id: 'obs-03',
        title: 'Legacy Weak Cipher Fallback Detected',
        category: 'TLS Hygiene',
        severity: 'MEDIUM',
        description: 'Perimeter negotiates legacy TLS fallback under specific handshake conditions.',
      },
    ],
  };

  describe('1. Full Guest Workspace Projection & Data Fidelity', () => {
    it('produces an authoritative view model matching the domain and session', () => {
      const vm = adaptAssessmentDataToGuestWorkspace(
        'stripe.com',
        sampleAssessmentData,
        'ses_test_master_123',
        'job_test_master_456'
      );

      assert.equal(vm.domain, 'stripe.com');
      assert.equal(vm.sessionId, 'ses_test_master_123');
      assert.equal(vm.jobId, 'job_test_master_456');
      assert.ok(vm.executiveNarrative.paragraphs.length >= 2);
    });

    it('correctly maps 5 multi-hop ingress flow layers', () => {
      const vm = adaptAssessmentDataToGuestWorkspace('stripe.com', sampleAssessmentData);
      assert.equal(vm.ingressHops.length, 5);
      assert.equal(vm.ingressHops[0].role, 'CLIENT');
      assert.equal(vm.ingressHops[0].title, 'Public Client');
      assert.equal(vm.ingressHops[1].role, 'EDGE');
      assert.equal(vm.ingressHops[1].title, 'Cloudflare');
      assert.equal(vm.ingressHops[2].role, 'GATEWAY');
      assert.equal(vm.ingressHops[2].title, 'Nginx');
      assert.equal(vm.ingressHops[3].role, 'APP');
      assert.equal(vm.ingressHops[3].title, 'React');
      assert.equal(vm.ingressHops[4].role, 'CLOUD');
      assert.equal(vm.ingressHops[4].title, 'Amazon Web Services');
    });

    it('computes exact 6-tier severity counts and identifies actionable items', () => {
      const vm = adaptAssessmentDataToGuestWorkspace('stripe.com', sampleAssessmentData);
      assert.equal(vm.severityDistribution.total, 3);
      assert.equal(vm.severityDistribution.critical, 0);
      assert.equal(vm.severityDistribution.high, 1);
      assert.equal(vm.severityDistribution.medium, 1);
      assert.equal(vm.severityDistribution.low, 0);
      assert.equal(vm.severityDistribution.informational, 1);

      const actionable = vm.findings.filter((f) => f.isActionable);
      assert.equal(actionable.length, 1); // 1 HIGH is actionable
    });

    it('extracts cryptographically bound wire evidence with valid SHA-256 prefixes', () => {
      const vm = adaptAssessmentDataToGuestWorkspace('stripe.com', sampleAssessmentData);
      assert.ok(vm.rawEvidenceRecords.length >= 3);
      for (const record of vm.rawEvidenceRecords) {
        assert.ok(record.verificationHash.startsWith('sha256:'));
        assert.ok(record.payload.length > 0);
        assert.ok(record.collector.toLowerCase().includes('nebula'));
      }
    });
  });

  describe('2. Security Boundary & Ephemeral Isolation Gate', () => {
    it('approves compliant guest tab navigation', () => {
      for (const tab of GUEST_WORKSPACE_TABS) {
        const check = auditGuestWorkspaceSecurity({
          activeTab: tab.id,
        });
        assert.equal(check.permitted, true);
      }
    });

    it('strictly blocks unauthorized attempts to invoke authenticated workspace routes', () => {
      const check = auditGuestWorkspaceSecurity({
        activeTab: 'overview',
        requestedEndpoint: '/api/v1/workspace/domains',
      });
      assert.equal(check.permitted, false);
      assert.ok(check.violation?.includes('forbidden from invoking protected endpoint'));
    });

    it('validates navigation configuration integrity', () => {
      const valid = validateGuestHeaderNavConfig({
        domain: 'stripe.com',
        activeTab: 'findings',
        isEphemeral: true,
        isVerified: true,
        findingsCount: 3,
        evidenceCount: 12,
      });
      assert.equal(valid.valid, true);
    });
  });

  describe('3. Master Invariant & Architecture Conformance', () => {
    it('verifies all 10 GX-R013 Workspace Shell Invariants are present and frozen', () => {
      assert.equal(GX_R013_INVARIANTS.length, 10);
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('Workspace Parity')));
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('Zero Privilege Escalation')));
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('Token Isolation')));
    });

    it('verifies all 5 GX-R014 Header & Nav Invariants are present and frozen', () => {
      assert.equal(GX_R014_INVARIANTS.length, 5);
      assert.ok(GX_R014_INVARIANTS.some((i) => i.includes('Persistent Orientation')));
      assert.ok(GX_R014_INVARIANTS.some((i) => i.includes('Prominent Claim')));
    });
  });
});
