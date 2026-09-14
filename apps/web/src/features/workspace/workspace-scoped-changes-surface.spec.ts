import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { integrateAuthoritativeChanges } from './contracts/snapshot-comparison.contract.ts';
import type { InfrastructureSnapshotDto, TimelineEventDto } from '../../types/api';

describe('WX-1029: Domain-Scoped Changes Surface Architecture', () => {
  const stripeDomainId = 'dom-stripe-001';
  const stripeDomainName = 'stripe.com';
  const openaiDomainId = 'dom-openai-002';
  const openaiDomainName = 'openai.com';

  const stripeSnapshotA: InfrastructureSnapshotDto = {
    id: 'snp-stripe-1',
    domainId: stripeDomainId,
    capturedAt: '2026-08-20T10:00:00Z',
    createdAt: '2026-08-20T10:00:00Z',
    httpStatus: 200,
    responseTimeMs: 95,
  };

  const stripeSnapshotB: InfrastructureSnapshotDto = {
    id: 'snp-stripe-2',
    domainId: stripeDomainId,
    capturedAt: '2026-08-26T10:00:00Z',
    createdAt: '2026-08-26T10:00:00Z',
    httpStatus: 200,
    responseTimeMs: 90,
  };

  const stripeEvent: TimelineEventDto = {
    id: 'evt-stripe-001',
    domainId: stripeDomainId,
    domainName: stripeDomainName,
    snapshotId: stripeSnapshotB.id,
    currentSnapshotId: stripeSnapshotB.id,
    previousSnapshotId: stripeSnapshotA.id,
    changeType: 'HTTP_HEADER_MODIFIED',
    category: 'http_security',
    severity: 'MEDIUM',
    title: 'HSTS header configured on stripe.com',
    description: 'Strict-Transport-Security enabled with 1-year max-age.',
    detectedAt: '2026-08-26T10:01:00Z',
    evidenceCount: 1,
  };

  const openaiEvent: TimelineEventDto = {
    id: 'evt-openai-002',
    domainId: openaiDomainId,
    domainName: openaiDomainName,
    snapshotId: 'snp-openai-1',
    currentSnapshotId: 'snp-openai-1',
    changeType: 'DNS_RECORD_MODIFIED',
    category: 'dns',
    severity: 'LOW',
    title: 'DNS MX record modified on openai.com',
    description: 'Mail server route updated.',
    detectedAt: '2026-08-26T09:00:00Z',
    evidenceCount: 1,
  };

  it('1. Strictly isolates changes to the active domain context', () => {
    const mixedEvents = [stripeEvent, openaiEvent];

    const stripeIntegration = integrateAuthoritativeChanges({
      domainId: stripeDomainId,
      domainName: stripeDomainName,
      snapshots: [stripeSnapshotA, stripeSnapshotB],
      timelineEvents: mixedEvents,
      isLoading: false,
      isError: false,
    });

    // Verify only Stripe changes are included in the changes list
    assert.strictEqual(stripeIntegration.state, 'CHANGES_DETECTED');
    assert.strictEqual(stripeIntegration.changes.length, 1);
    assert.strictEqual(stripeIntegration.changes[0].domainId, stripeDomainId);
    assert.strictEqual(stripeIntegration.changes[0].domainName, stripeDomainName);
    assert.ok(!stripeIntegration.changes.some((s) => s.domainId === openaiDomainId));
  });

  it('2. Preserves chronological comparisons within the scoped domain context', () => {
    const stripeIntegration = integrateAuthoritativeChanges({
      domainId: stripeDomainId,
      domainName: stripeDomainName,
      snapshots: [stripeSnapshotA, stripeSnapshotB],
      timelineEvents: [stripeEvent],
      isLoading: false,
      isError: false,
    });

    assert.strictEqual(stripeIntegration.snapshotPair.hasComparisonPair, true);
    assert.strictEqual(stripeIntegration.snapshotPair.currentSnapshot?.id, stripeSnapshotB.id);
    assert.strictEqual(stripeIntegration.snapshotPair.previousSnapshot?.id, stripeSnapshotA.id);
  });
});
