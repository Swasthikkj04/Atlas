import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R013_TICKET_ID,
  GX_R013_PHASE,
  GX_R013_STATUS,
  GX_R013_PRIMARY_PRINCIPLE,
  GX_R013_FROZEN_PRINCIPLES,
  GX_R013_ACCEPTANCE_GATE_STATEMENT,
  GX_R013_CERTIFICATION_GATE_STATEMENT,
  GUEST_WORKSPACE_TABS,
  adaptAssessmentDataToGuestWorkspace,
  auditGuestWorkspaceSecurity,
  GX_R013_INVARIANTS,
  verifyGXR013CertificationGate,
} from './gx-r013-guest-workspace-shell.contract.ts';
import type { AssessmentData } from '../types/index.ts';

describe('GX-R013: Guest Workspace Shell & Visual Authority Contract', () => {
  describe('1. Canonical Metadata & Acceptance Gate', () => {
    it('defines ticket metadata and status', () => {
      assert.equal(GX_R013_TICKET_ID, 'GX-R013');
      assert.equal(GX_R013_PHASE, 'Guest Experience Architecture');
      assert.equal(GX_R013_STATUS, 'FROZEN_GUEST_WORKSPACE_CONTRACT');
    });

    it('embodies the frozen principles', () => {
      assert.equal(
        GX_R013_PRIMARY_PRINCIPLE,
        'Deliver the full intelligence workspace, not a stripped-down article.'
      );
      assert.ok(
        GX_R013_FROZEN_PRINCIPLES.includes(
          'Guest workspace is ephemeral, single-domain, and read-only; privilege escalation is strictly forbidden.'
        )
      );
      assert.ok(
        GX_R013_FROZEN_PRINCIPLES.includes(
          'The upgrade bridge is natural and educational, revealing the continuous power of Workspace without artificial friction.'
        )
      );
    });

    it('passes the 🔒 GX-R013 Certification Gate with canonical statement', () => {
      const result = verifyGXR013CertificationGate(GX_R013_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R013_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects a non-compliant statement advocating noisy paywalls or data dilution', () => {
      const statement = 'Force users to sign up immediately before showing any findings or data.';
      const result = verifyGXR013CertificationGate(statement);
      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.35);
    });

    it('verifies acceptance gate demonstrated truth statement is defined', () => {
      assert.ok(GX_R013_ACCEPTANCE_GATE_STATEMENT.includes('full visual authority'));
      assert.ok(GX_R013_ACCEPTANCE_GATE_STATEMENT.includes('spatial density'));
      assert.ok(GX_R013_ACCEPTANCE_GATE_STATEMENT.includes('without compromising tenant isolation'));
    });
  });

  describe('2. Canonical Navigation Tabs Model', () => {
    it('defines canonical guest workspace tabs including infrastructure', () => {
      assert.equal(GUEST_WORKSPACE_TABS.length, 6);
      const tabIds = GUEST_WORKSPACE_TABS.map((t) => t.id);
      assert.deepEqual(tabIds, ['overview', 'architecture', 'infrastructure', 'findings', 'evidence', 'history']);
    });

    it('sets correct active vs locked states for guest tabs', () => {
      const activeTabs = GUEST_WORKSPACE_TABS.filter((t) => t.status === 'ACTIVE');
      assert.equal(activeTabs.length, 5);

      const historyTab = GUEST_WORKSPACE_TABS.find((t) => t.id === 'history');
      assert.ok(historyTab);
      assert.equal(historyTab?.status, 'LOCKED_PREVIEW');
      assert.equal(historyTab?.badge, 'Workspace');
    });

    it('ensures each tab has a descriptive label, icon, and purpose description', () => {
      GUEST_WORKSPACE_TABS.forEach((tab) => {
        assert.ok(tab.label.length > 0);
        assert.ok(tab.shortLabel.length > 0);
        assert.ok(tab.iconName.length > 0);
        assert.ok(tab.description.length > 10);
      });
    });
  });

  describe('3. Guest Workspace State Adapter', () => {
    const mockAssessmentData: AssessmentData = {
      domain: 'stripe.com',
      sessionId: 'ses_12345',
      jobId: 'gst_job_67890',
      brief: {
        paragraphs: [
          'Stripe perimeter architecture demonstrates advanced multi-tier edge routing.',
          'Automated TLS 1.3 certificates and Anycast CDN distribution observed.',
        ],
        stats: {
          techCount: 4,
          observationCount: 3,
          evidenceCount: 3,
          timelineCount: 0,
          criticalCount: 0,
        },
      },
      technologies: [
        { name: 'Cloudflare', role: 'Edge CDN', category: 'Edge & CDN', confidence: 'high', evidenceCount: 3 },
        { name: 'Nginx', role: 'Reverse Proxy', category: 'Ingress & Gateway', confidence: 'high', evidenceCount: 2 },
        { name: 'Next.js', role: 'Application Framework', category: 'Application & Frameworks', confidence: 'high', evidenceCount: 2 },
        { name: 'AWS', role: 'Cloud Hosting', category: 'Cloud & Hosting', confidence: 'high', evidenceCount: 4 },
      ],
      observations: [
        {
          label: 'HSTS Strict-Transport-Security Missing',
          severity: 'HIGH',
          category: 'TLS & Security',
          body: 'The HSTS response header was not detected. This allows potential unencrypted downgrades.',
        },
        {
          label: 'DMARC Quarantine Policy Active',
          severity: 'INFORMATIONAL',
          category: 'DNS & Mail',
          body: 'Authoritative DMARC record enforces quarantine mode.',
        },
        {
          label: 'TLS 1.3 Encryption Verified',
          severity: 'LOW',
          category: 'TLS & Security',
          body: 'Modern cipher suite negotiated with strong AEAD cipher.',
        },
      ],
      evidence: [
        {
          id: 'ev-http-1',
          category: 'HTTP Headers',
          title: 'HTTP Response Headers for stripe.com',
          summary: 'Status 200 OK with custom edge headers',
          source: 'HTTP Probe',
          collector: 'http-discovery v1.0.0',
          collectedAt: '2026-09-04',
          payload: '{"server": "cloudflare", "content-type": "text/html"}',
        },
        {
          id: 'ev-dns-1',
          category: 'DNS Records',
          title: 'DNS Resource Records for stripe.com',
          summary: 'Anycast DNS with 4 nameservers',
          source: 'DNS Lookup',
          collector: 'dns-discovery v1.0.0',
          collectedAt: '2026-09-04',
          payload: '{"ns": ["ns1.cloudflare.com", "ns2.cloudflare.com"]}',
        },
      ],
      timeline: [],
    };

    it('adapts realistic AssessmentData into high-precision GuestWorkspaceViewModel', () => {
      const viewModel = adaptAssessmentDataToGuestWorkspace('stripe.com', mockAssessmentData, 'ses_12345', 'gst_job_67890');

      assert.equal(viewModel.domain, 'stripe.com');
      assert.equal(viewModel.sessionId, 'ses_12345');
      assert.equal(viewModel.jobId, 'gst_job_67890');
      assert.equal(viewModel.executiveNarrative.paragraphs.length, 2);
      assert.equal(viewModel.executiveNarrative.highlightedEntities.length, 4);

      // Severity breakdown
      assert.equal(viewModel.severityDistribution.high, 1);
      assert.equal(viewModel.severityDistribution.low, 1);
      assert.equal(viewModel.severityDistribution.informational, 1);
      assert.equal(viewModel.severityDistribution.critical, 0);
      assert.equal(viewModel.severityDistribution.total, 3);

      // Ingress hops synthesis
      assert.ok(viewModel.ingressHops.length >= 4);
      assert.equal(viewModel.ingressHops[0].role, 'CLIENT');
      assert.equal(viewModel.ingressHops[1].role, 'EDGE');
      assert.equal(viewModel.ingressHops[1].title, 'Cloudflare');

      // Perimeter Vitals
      assert.equal(viewModel.perimeterVitals.actionableFindingsCount, 1);
      assert.equal(viewModel.perimeterVitals.postureVerdict, 'Actionable Perimeter Posture Notice');
      assert.equal(viewModel.perimeterVitals.postureScore, 'Grade B · Notable Exposure');
    });

    it('handles empty or null AssessmentData gracefully with fallback synthesis', () => {
      const fallbackModel = adaptAssessmentDataToGuestWorkspace('empty-domain.io', null);

      assert.equal(fallbackModel.domain, 'empty-domain.io');
      assert.ok(fallbackModel.sessionId.startsWith('ses_guest_'));
      assert.ok(fallbackModel.executiveNarrative.paragraphs.length >= 1);
      assert.equal(fallbackModel.severityDistribution.total, 0);
      assert.equal(fallbackModel.ingressHops.length, 1); // Client hop
      assert.equal(fallbackModel.perimeterVitals.postureVerdict, 'Optimal Baseline Hygiene');
    });

    it('correctly isolates occurrence and whyItMatters in findings', () => {
      const viewModel = adaptAssessmentDataToGuestWorkspace('stripe.com', mockAssessmentData);
      const hstsFinding = viewModel.findings.find((f) => f.label.includes('HSTS'));

      assert.ok(hstsFinding);
      assert.equal(hstsFinding?.occurrence, 'The HSTS response header was not detected.');
      assert.equal(hstsFinding?.whyItMatters, 'This allows potential unencrypted downgrades.');
      assert.equal(hstsFinding?.isActionable, true);
    });
  });

  describe('4. Security Isolation Auditor', () => {
    it('permits standard guest workspace tab navigation', () => {
      const auditOverview = auditGuestWorkspaceSecurity({ activeTab: 'overview' });
      assert.equal(auditOverview.permitted, true);

      const auditArch = auditGuestWorkspaceSecurity({ activeTab: 'architecture' });
      assert.equal(auditArch.permitted, true);

      const auditHistory = auditGuestWorkspaceSecurity({ activeTab: 'history' });
      assert.equal(auditHistory.permitted, true);
    });

    it('rejects navigation to non-existent or invalid tab', () => {
      const auditInvalid = auditGuestWorkspaceSecurity({ activeTab: 'admin_private_tab' });
      assert.equal(auditInvalid.permitted, false);
      assert.ok(auditInvalid.violation?.includes('Invalid guest workspace tab'));
    });

    it('blocks any attempted invocation of protected /api/v1/workspace endpoints', () => {
      const audit = auditGuestWorkspaceSecurity({
        activeTab: 'overview',
        requestedEndpoint: '/api/v1/workspace/domains/all',
      });

      assert.equal(audit.permitted, false);
      assert.ok(audit.violation?.includes('forbidden from invoking protected endpoint'));
    });

    it('blocks cross-tenant target injection', () => {
      const audit = auditGuestWorkspaceSecurity({
        activeTab: 'overview',
        targetTenantId: 'tenant_private_enterprise_492',
      });

      assert.equal(audit.permitted, false);
      assert.ok(audit.violation?.includes('cannot request tenant data for foreign tenant'));
    });
  });

  describe('5. Ten Certified Core Invariants (GX-R013-I01 → GX-R013-I10)', () => {
    it('verifies all 10 core invariants are established', () => {
      assert.equal(GX_R013_INVARIANTS.length, 10);
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('GX-R013-I01 — Workspace Parity')));
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('GX-R013-I02 — Ephemeral Public Scope')));
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('GX-R013-I03 — Zero Privilege Escalation')));
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('GX-R013-I05 — Educational History Preview')));
      assert.ok(GX_R013_INVARIANTS.some((i) => i.includes('GX-R013-I09 — Calm Upgrade Bridge')));
    });
  });
});
