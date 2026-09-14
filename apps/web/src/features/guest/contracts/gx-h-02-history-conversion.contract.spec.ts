import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GX_H02_TICKET_ID,
  GX_H02_PHASE,
  GX_H02_PRIORITY,
  GX_H02_STATUS,
  GX_H02_CORE_EXPERIENCE_THESIS,
  GX_H02_DESIGN_GATE_STATEMENT,
  EXPLICITLY_REJECTED_CONVERSION_PATTERNS,
  CANONICAL_WORKSPACE_VALUE_PROPOSITIONS,
  CANONICAL_CONVERSION_PANEL_CONTENT,
  deriveDemonstratedIntelligenceSummary,
  getCanonicalConversionPanelContent,
  validateConversionSurfaceLayout,
  verifyGXH02CertificationGate,
} from './gx-h-02-history-conversion.contract.ts';
import type { GuestWorkspaceViewModel } from './gx-r013-guest-workspace-shell.contract.ts';

const MOCK_VIEW_MODEL: GuestWorkspaceViewModel = {
  domain: 'stripe.com',
  sessionId: 'sess-gx-h02-test',
  jobId: 'job-gx-h02-test',
  snapshotTimestamp: '2026-09-05T12:00:00.000Z',
  perimeterVitals: {
    postureVerdict: 'FAVORABLE',
    postureScore: 'A',
    tlsCipherSuite: 'TLS_AES_256_GCM_SHA384',
    ingressHopsCount: 3,
    actionableFindingsCount: 3,
    totalEvidenceCount: 5,
  },
  categorizedComponents: [
    {
      category: 'Edge & CDN',
      name: 'Cloudflare Edge Proxy',
      confidence: 'HIGH',
      rationale: 'Observed Cloudflare proxy headers.',
    },
    {
      category: 'Web Gateway',
      name: 'envoy proxy',
      confidence: 'HIGH',
      rationale: 'Observed Server envoy header.',
    },
  ],
  findings: [
    {
      id: 'f-1',
      title: 'Missing Content-Security-Policy',
      severity: 'LOW',
      category: 'HTTP_SECURITY',
      description: 'CSP header missing.',
      remediation: 'Configure CSP.',
    },
    {
      id: 'f-2',
      title: 'Missing Strict-Transport-Security preload',
      severity: 'LOW',
      category: 'TLS',
      description: 'HSTS preload missing.',
      remediation: 'Add preload directive.',
    },
    {
      id: 'f-3',
      title: 'Informational Server Header Exposed',
      severity: 'INFO',
      category: 'INFORMATION_DISCLOSURE',
      description: 'Server banner envoy observed.',
      remediation: 'Mask server banner.',
    },
  ],
  rawEvidenceRecords: [],
};

describe('GX-H-02 — Premium History & Drift Conversion Surface Contracts', () => {
  it('GX-H-02-01: validates ticket identity, phase, priority, and certification gate statements', () => {
    assert.equal(GX_H02_TICKET_ID, 'GX-H-02');
    assert.equal(GX_H02_PHASE, 'Guest Experience — History & Drift');
    assert.equal(GX_H02_PRIORITY, 'P1');
    assert.equal(GX_H02_STATUS, 'FROZEN_HISTORY_CONVERSION_CONTRACT');
    assert.ok(GX_H02_DESIGN_GATE_STATEMENT.includes('Demonstrate intelligence first'));
    assert.ok(GX_H02_DESIGN_GATE_STATEMENT.includes('Place conversion beside the demonstrated value'));
  });

  it('GX-H-02-02: enforces core experience thesis: Nebula understood your infrastructure, now let it remember', () => {
    assert.equal(
      GX_H02_CORE_EXPERIENCE_THESIS,
      'Nebula understood your infrastructure. Now let Nebula remember it.'
    );
  });

  it('GX-H-02-03: explicitly rejects long scrolling sales reports and bottom-of-page CTAs', () => {
    assert.ok(EXPLICITLY_REJECTED_CONVERSION_PATTERNS.includes('BOTTOM_OF_PAGE_CONVERSION_CTA'));
    assert.ok(EXPLICITLY_REJECTED_CONVERSION_PATTERNS.includes('LONG_SCROLLING_SALES_DOCUMENT'));
    assert.ok(EXPLICITLY_REJECTED_CONVERSION_PATTERNS.includes('ICON_PER_ROW_PROLIFERATION'));
    assert.ok(EXPLICITLY_REJECTED_CONVERSION_PATTERNS.includes('EXCESSIVE_PILL_BADGE_CLUTTER'));
    assert.ok(EXPLICITLY_REJECTED_CONVERSION_PATTERNS.includes('MARKETING_GRADIENT_NOISE'));
    assert.ok(EXPLICITLY_REJECTED_CONVERSION_PATTERNS.includes('FAKE_WORKSPACE_MONITORING_IN_GX'));
    assert.ok(EXPLICITLY_REJECTED_CONVERSION_PATTERNS.includes('COERCIVE_PAYWALL_RHETORIC'));
  });

  it('GX-H-02-04: validates canonical right-side conversion surface layout rules', () => {
    const layout = validateConversionSurfaceLayout({
      isRightSideConversion: true,
      isCtaAdjacentToDemonstratedIntelligence: true,
      valuePropositionsCount: 3,
    });
    assert.equal(layout.isValid, true);
    assert.equal(layout.violations.length, 0);
  });

  it('GX-H-02-05: rejects layouts with non-adjacent CTAs or incorrect value prop counts', () => {
    const invalidLayout = validateConversionSurfaceLayout({
      isRightSideConversion: false,
      isCtaAdjacentToDemonstratedIntelligence: false,
      valuePropositionsCount: 5,
    });
    assert.equal(invalidLayout.isValid, false);
    assert.equal(invalidLayout.violations.length, 3);
  });

  it('GX-H-02-06: derives demonstrated intelligence summary with relative capture time', () => {
    const summary = deriveDemonstratedIntelligenceSummary(MOCK_VIEW_MODEL);
    assert.equal(summary.domain, 'stripe.com');
    assert.equal(summary.capturedRelativeTime, 'Captured just now');
    assert.ok(summary.formattedTimestamp.length > 0);
  });

  it('GX-H-02-07: demonstrated intelligence summary includes signals count and findings count', () => {
    const summary = deriveDemonstratedIntelligenceSummary(MOCK_VIEW_MODEL);
    assert.equal(summary.signalsCount, 5);
    assert.equal(summary.findingsCount, 3);
  });

  it('GX-H-02-08: demonstrated intelligence summary extracts observed wire context items', () => {
    const summary = deriveDemonstratedIntelligenceSummary(MOCK_VIEW_MODEL);
    assert.ok(summary.wireSummary.length >= 2);
    const edge = summary.wireSummary.find((w) => w.label === 'Edge CDN');
    assert.ok(edge && edge.value.includes('Cloudflare'));
  });

  it('GX-H-02-09: demonstrated intelligence guarantees AUTHORITATIVE_POINT_IN_TIME provenance', () => {
    const summary = deriveDemonstratedIntelligenceSummary(MOCK_VIEW_MODEL);
    assert.equal(summary.provenanceStatus, 'AUTHORITATIVE_POINT_IN_TIME');
  });

  it('GX-H-02-10: conversion panel heading matches canonical "Remember this."', () => {
    const content = getCanonicalConversionPanelContent();
    assert.equal(content.heading, 'Remember this.');
  });

  it('GX-H-02-11: conversion panel supporting narrative matches canonical specification', () => {
    const content = getCanonicalConversionPanelContent();
    assert.equal(
      content.supportingMessage,
      'Your perimeter is understood. Keep that understanding alive.'
    );
  });

  it('GX-H-02-12: communicates exactly 3 compact value propositions', () => {
    const content = getCanonicalConversionPanelContent();
    assert.equal(content.valuePropositions.length, 3);
    assert.deepEqual(content.valuePropositions, CANONICAL_WORKSPACE_VALUE_PROPOSITIONS);
  });

  it('GX-H-02-13: first value prop is Continuous Drift ("Know what changes.")', () => {
    const prop1 = CANONICAL_WORKSPACE_VALUE_PROPOSITIONS[0];
    assert.equal(prop1.title, 'Continuous Drift');
    assert.equal(prop1.tagline, 'Know what changes.');
  });

  it('GX-H-02-14: second value prop is Perimeter Alerts ("Know when something matters.")', () => {
    const prop2 = CANONICAL_WORKSPACE_VALUE_PROPOSITIONS[1];
    assert.equal(prop2.title, 'Perimeter Alerts');
    assert.equal(prop2.tagline, 'Know when something matters.');
  });

  it('GX-H-02-15: third value prop is Infrastructure Memory ("Build context over time.")', () => {
    const prop3 = CANONICAL_WORKSPACE_VALUE_PROPOSITIONS[2];
    assert.equal(prop3.title, 'Infrastructure Memory');
    assert.equal(prop3.tagline, 'Build context over time.');
  });

  it('GX-H-02-16: primary CTA is clearly labeled "Claim this infrastructure →"', () => {
    const content = getCanonicalConversionPanelContent();
    assert.equal(content.ctaLabel, 'Claim this infrastructure →');
  });

  it('GX-H-02-17: conversion panel includes reassurance: "Current observation preserved · No re-scan required"', () => {
    const content = getCanonicalConversionPanelContent();
    assert.equal(
      content.reassuranceText,
      'Current observation preserved · No re-scan required'
    );
  });

  it('GX-H-02-18: verifyGXH02CertificationGate passes for valid view model', () => {
    const gate = verifyGXH02CertificationGate(MOCK_VIEW_MODEL);
    assert.equal(gate.certified, true);
    assert.equal(gate.reasons.length, 0);
  });

  it('GX-H-02-19: preserves strict GX security boundary (zero workspace tenant leakage)', () => {
    const summary = deriveDemonstratedIntelligenceSummary(MOCK_VIEW_MODEL);
    assert.ok(!('tenantId' in summary));
    assert.ok(!('workspaceId' in summary));
  });

  it('GX-H-02-20: enforces epistemic boundary where GX remains ephemeral and memory begins in WX', () => {
    const content = getCanonicalConversionPanelContent();
    assert.ok(content.supportingMessage.includes('Keep that understanding alive'));
    assert.ok(content.reassuranceText.includes('preserved'));
  });
});
