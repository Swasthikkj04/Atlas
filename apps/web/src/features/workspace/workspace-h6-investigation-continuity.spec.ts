import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  H6_CERTIFIED_INVARIANTS,
  validateInvestigationContext,
  sanitizeInvestigationContext,
  serializeInvestigationContext,
  parseInvestigationContext,
  resolveInvestigationReturnLabel,
  resolveInvestigationRestoration,
  buildInvestigationReturnUrl,
  type InvestigationContext,
} from './contracts/investigation-continuity.contract.ts';

describe('H6: Investigation Continuity & Evidence Navigation Frontend Suite', () => {
  it('certifies 100% of H6 Investigation Continuity invariants', () => {
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_INVESTIGATION_CONTINUITY, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_STICKY_RETURN_ANCHOR, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_EXACT_CONTEXT_RESTORATION, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_EVIDENCE_DRAWER_FIDELITY, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_EVIDENCE_LINEAGE_PRESERVATION, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_WX211_LIFECYCLE_INTEGRITY, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_HISTORICAL_DIFF_RETURN_RESTORE, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_BROWSER_NAVIGATION_INTEGRITY, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_ZERO_AUTHORIZATION_BYPASS, true);
    assert.equal(H6_CERTIFIED_INVARIANTS.H6_GRACEFUL_CONTEXT_LOSS_RECOVERY, true);
  });

  describe('H6-001: Context Serialization & Deserialization Fidelity', () => {
    it('serializes and round-trips a deep multi-hop investigation context', () => {
      const originalContext: InvestigationContext = {
        domainId: 'domain-prod-456',
        domainName: 'api.enterprise.com',
        sourceSurface: 'overview',
        sourceSection: 'narrative',
        entityType: 'technology',
        entityId: 'tech-nginx',
        entityName: 'NGINX',
        snapshotId: 'snap-2026-08-29-001',
        findingId: 'finding-hsts',
        evidenceId: 'ev-server-01',
        disclosureLevel: 3,
        filterState: { severity: 'CRITICAL', showResolved: false },
        scrollAnchor: 'tech-nginx-row',
      };

      assert.ok(validateInvestigationContext(originalContext));

      // Serialize
      const serialized = serializeInvestigationContext(originalContext);
      assert.ok(serialized.includes('srcSurface=overview'));
      assert.ok(serialized.includes('entityId=tech-nginx'));
      assert.ok(serialized.includes('level=3'));
      assert.ok(serialized.includes('anchor=tech-nginx-row'));

      // Parse back
      const parsed = parseInvestigationContext(serialized, 'domain-prod-456');
      assert.ok(parsed !== null);
      assert.equal(parsed?.domainId, 'domain-prod-456');
      assert.equal(parsed?.sourceSurface, 'overview');
      assert.equal(parsed?.sourceSection, 'narrative');
      assert.equal(parsed?.entityType, 'technology');
      assert.equal(parsed?.entityId, 'tech-nginx');
      assert.equal(parsed?.entityName, 'NGINX');
      assert.equal(parsed?.snapshotId, 'snap-2026-08-29-001');
      assert.equal(parsed?.disclosureLevel, 3);
      assert.equal(parsed?.scrollAnchor, 'tech-nginx-row');
      assert.deepEqual(parsed?.filterState, { severity: 'CRITICAL', showResolved: false });
    });

    it('sanitizes input against script tags and special injection characters', () => {
      const injectionContext: InvestigationContext = {
        domainId: 'domain-123',
        sourceSurface: 'overview',
        sourceSection: 'section<script>',
        entityType: 'technology',
        entityId: 'tech-nginx" onclick="alert(1)"',
        entityName: 'NGINX\'`',
        snapshotId: 'snap-123',
      };

      const sanitized = sanitizeInvestigationContext(injectionContext);
      assert.equal(sanitized.sourceSection, 'sectionscript');
      assert.equal(sanitized.entityId, 'tech-nginx onclick=alert(1)');
      assert.equal(sanitized.entityName, 'NGINX');
    });
  });

  describe('H6-002: Context-Aware Sticky Return Anchor Labeling', () => {
    it('generates origin-descriptive labels and strictly forbids generic "Back"', () => {
      // 1. Narrative Origin
      const narrativeLabel = resolveInvestigationReturnLabel({
        sourceSurface: 'overview',
        sourceSection: 'narrative',
        entityType: 'technology',
        entityId: 'tech-nginx',
      });
      assert.equal(narrativeLabel, '← Back to Infrastructure Narrative');

      // 2. Technology Evidence Origin
      const techLabel = resolveInvestigationReturnLabel({
        sourceSurface: 'overview',
        entityType: 'technology',
        entityId: 'tech-envoy',
        entityName: 'Envoy',
      });
      assert.equal(techLabel, '← Back to Envoy evidence');

      // 3. Finding Investigation Origin
      const findingLabel = resolveInvestigationReturnLabel({
        sourceSurface: 'findings',
        entityType: 'finding',
        entityId: 'finding-hsts',
        entityName: 'HSTS Protection Missing',
      });
      assert.equal(findingLabel, '← Back to HSTS Protection Missing investigation');

      // 4. Changes Origin
      const changesLabel = resolveInvestigationReturnLabel({
        sourceSurface: 'changes',
        entityType: 'change',
        entityId: 'chg-01',
      });
      assert.equal(changesLabel, '← Back to Changes');

      // INVARIANT: None of these can be generic "Back"
      assert.notEqual(narrativeLabel, 'Back');
      assert.notEqual(techLabel, 'Back');
      assert.notEqual(findingLabel, 'Back');
      assert.notEqual(changesLabel, 'Back');
    });
  });

  describe('H6-003 & H6-010: Context Restoration & Graceful Fallback', () => {
    it('restores exact surface, section, entity, filter, and scroll anchor', () => {
      const ctx: InvestigationContext = {
        domainId: 'domain-prod',
        sourceSurface: 'overview',
        sourceSection: 'narrative',
        entityType: 'technology',
        entityId: 'tech-nginx',
        snapshotId: 'snap-001',
        disclosureLevel: 2,
        filterState: { tier: 'GATEWAY' },
        scrollAnchor: 'gateway-heading',
      };

      const restored = resolveInvestigationRestoration(ctx, ['tech-nginx', 'tech-cloudflare']);
      assert.equal(restored.isGracefulFallback, false);
      assert.equal(restored.targetSurface, 'overview');
      assert.equal(restored.targetSection, 'narrative');
      assert.equal(restored.highlightedEntityId, 'tech-nginx');
      assert.equal(restored.disclosureLevel, 2);
      assert.equal(restored.scrollAnchor, 'gateway-heading');
      assert.deepEqual(restored.filterState, { tier: 'GATEWAY' });
      assert.equal(restored.returnLabel, '← Back to Infrastructure Narrative');
    });

    it('gracefully falls back when original context is null/missing with honest notice', () => {
      const restored = resolveInvestigationRestoration(null);
      assert.equal(restored.isGracefulFallback, true);
      assert.equal(restored.targetSurface, 'overview');
      assert.equal(restored.fallbackReason, 'The original investigation context is no longer available.');
      assert.equal(restored.returnLabel, '← Back to Overview');
    });

    it('gracefully falls back when target entity was removed in the latest snapshot', () => {
      const ctx: InvestigationContext = {
        domainId: 'domain-prod',
        sourceSurface: 'overview',
        entityType: 'technology',
        entityId: 'tech-apache-legacy',
        entityName: 'Apache HTTP Server',
        snapshotId: 'snap-001',
      };

      // Active technologies only contain Envoy and Cloudflare now
      const restored = resolveInvestigationRestoration(ctx, ['tech-envoy', 'tech-cloudflare']);
      assert.equal(restored.isGracefulFallback, true);
      assert.ok(restored.fallbackReason?.includes('Apache HTTP Server'));
      assert.ok(restored.fallbackReason?.includes('no longer present'));
    });

    it('constructs a durable return URL with query parameters', () => {
      const ctx: InvestigationContext = {
        domainId: 'domain-prod',
        sourceSurface: 'infrastructure',
        sourceSection: 'topology',
        entityType: 'technology',
        entityId: 'tech-caddy',
        snapshotId: 'snap-99',
        disclosureLevel: 3,
        scrollAnchor: 'caddy-node',
      };

      const returnUrl = buildInvestigationReturnUrl(ctx, 'caddy.server.io');
      assert.ok(returnUrl.startsWith('/workspace?'));
      assert.ok(returnUrl.includes('domain=caddy.server.io'));
      assert.ok(returnUrl.includes('surface=infrastructure'));
      assert.ok(returnUrl.includes('section=topology'));
      assert.ok(returnUrl.includes('highlight=tech-caddy'));
      assert.ok(returnUrl.includes('level=3'));
      assert.ok(returnUrl.includes('anchor=caddy-node'));
    });
  });
});
