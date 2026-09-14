import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANGES_COPY,
  resolveAuthoritativeImpact,
  resolveChangesState,
  resolveMeaningfulChangeStory,
} from './contracts/changes.contract.ts';
import type { InfrastructureSnapshotDto } from './contracts/workspace-overview.contract.ts';

describe('H3: Frontend Infrastructure Change Forensics & Forensic Explanation UX', () => {
  const baseDomain = {
    id: 'dom-h3-test',
    domainName: 'example.com',
  };

  describe('1. Gateway Architecture Migration (NGINX -> Envoy)', () => {
    it('constructs forensic change story with anti-overreach guarantees for gateway shift', () => {
      const timelineEvent = {
        id: 'evt-gateway-migrated',
        detectedAt: '2026-08-29T10:00:00Z',
        currentSnapshotId: 'snap-2',
        previousSnapshotId: 'snap-1',
        domainId: baseDomain.id,
        domainName: baseDomain.domainName,
        title: 'Gateway architecture changed',
        description: 'Web gateway migrated from NGINX to Envoy.',
        changeType: 'MODIFIED',
        severity: 'MEDIUM',
        category: 'TECHNOLOGY',
        summary: 'Web gateway migrated from NGINX to Envoy.',
        whatThisEstablishes: 'Nebula verified that the publicly observable reverse proxy / gateway boundary changed based on observable headers.',
        whatThisDoesNotEstablish: 'This does not establish a Kubernetes migration, service-mesh deployment, or cloud-provider change.',
        previousValue: 'NGINX',
        currentValue: 'Envoy',
        evidenceCount: 2,
      };

      const story = resolveMeaningfulChangeStory(timelineEvent, baseDomain.domainName);

      assert.strictEqual(story.title, 'Gateway architecture changed');
      assert.strictEqual(story.previousValue, 'NGINX');
      assert.strictEqual(story.currentValue, 'Envoy');
      assert.ok(story.whatThisEstablishes?.includes('publicly observable reverse proxy / gateway boundary changed'));
      assert.ok(story.whatThisDoesNotEstablish?.includes('This does not establish a Kubernetes migration, service-mesh deployment, or cloud-provider change'));
      assert.strictEqual(story.evidenceCount, 2);
    });
  });

  describe('2. Application Framework Migration (Node.js -> Go)', () => {
    it('creates architectural change story without asserting phantom cloud migrations', () => {
      const timelineEvent = {
        id: 'evt-runtime-migrated',
        detectedAt: '2026-08-29T10:00:00Z',
        currentSnapshotId: 'snap-2',
        previousSnapshotId: 'snap-1',
        domainId: baseDomain.id,
        domainName: baseDomain.domainName,
        title: 'Application framework changed',
        description: 'Application framework migrated from Node.js to Go.',
        changeType: 'MODIFIED',
        severity: 'MEDIUM',
        category: 'TECHNOLOGY',
        summary: 'Application framework migrated from Node.js to Go.',
        whatThisEstablishes: 'Nebula verified that the application runtime or framework layer changed based on observable response signatures.',
        whatThisDoesNotEstablish: 'This does not establish an origin cloud provider migration or container orchestrator change.',
        previousValue: 'Node.js',
        currentValue: 'Go',
        evidenceCount: 2,
      };

      const story = resolveMeaningfulChangeStory(timelineEvent, baseDomain.domainName);

      assert.strictEqual(story.title, 'Application framework changed');
      assert.ok(story.whatThisDoesNotEstablish?.includes('This does not establish an origin cloud provider migration or container orchestrator change'));
    });
  });

  describe('3. Edge Delivery Drift (Cloudflare -> Fastly)', () => {
    it('verifies edge migration with negative boundary regarding origin servers', () => {
      const timelineEvent = {
        id: 'evt-edge-drift',
        detectedAt: '2026-08-29T10:00:00Z',
        currentSnapshotId: 'snap-2',
        previousSnapshotId: 'snap-1',
        domainId: baseDomain.id,
        domainName: baseDomain.domainName,
        title: 'Edge delivery network changed',
        description: 'Edge delivery changed from Cloudflare to Fastly.',
        changeType: 'MODIFIED',
        severity: 'MEDIUM',
        category: 'CDN',
        whatThisEstablishes: 'Nebula verified that edge delivery and caching infrastructure changed based on observable edge routing telemetry.',
        whatThisDoesNotEstablish: 'This does not prove that backend origin servers have migrated to a different cloud provider.',
        previousValue: 'Cloudflare',
        currentValue: 'Fastly',
        evidenceCount: 2,
      };

      const story = resolveMeaningfulChangeStory(timelineEvent, baseDomain.domainName);

      assert.strictEqual(story.title, 'Edge delivery network changed');
      assert.ok(story.whatThisDoesNotEstablish?.includes('This does not prove that backend origin servers have migrated to a different cloud provider'));
    });
  });

  describe('4. Quiet State Stability Invariant', () => {
    it('resolves QUIET state and preserves calm copy when multiple snapshots exist with zero changes', () => {
      const snapshots: InfrastructureSnapshotDto[] = [
        {
          id: 'snap-2',
          domainId: baseDomain.id,
          createdAt: '2026-08-29T10:00:00Z',
        } as any,
        {
          id: 'snap-1',
          domainId: baseDomain.id,
          createdAt: '2026-08-27T10:00:00Z',
        } as any,
      ];

      const state = resolveChangesState({
        snapshots,
        timelineEvents: [],
        isLoading: false,
        isError: false,
      });

      assert.strictEqual(state, 'QUIET');
      assert.strictEqual(CHANGES_COPY.QUIET_HEADLINE, 'No meaningful changes detected.');
      assert.strictEqual(CHANGES_COPY.QUIET_HEADING, 'Infrastructure remains stable');
    });
  });

  describe('5. Severity != Change: Impact Resolution Distinction', () => {
    it('maps architectural changes to neutral/informational impact and security regressions to negative/critical', () => {
      const archImpact = resolveAuthoritativeImpact('LOW', 'ADDED');
      assert.strictEqual(archImpact.impact, 'NEUTRAL');
      assert.strictEqual(archImpact.direction, 'NEUTRAL');

      const secImpact = resolveAuthoritativeImpact('HIGH', 'REMOVED');
      assert.strictEqual(secImpact.impact, 'NEGATIVE');
      assert.strictEqual(secImpact.direction, 'REGRESSION');

      const critImpact = resolveAuthoritativeImpact('CRITICAL', 'MODIFIED');
      assert.strictEqual(critImpact.impact, 'CRITICAL');
      assert.strictEqual(critImpact.direction, 'REGRESSION');
    });
  });
});
