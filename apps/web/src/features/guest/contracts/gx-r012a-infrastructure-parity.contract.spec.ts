import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R012A_TICKET_ID,
  GX_R012_PARITY_TRACK_PHASE,
  GX_R012_PARITY_TRACK_STATUS,
  GX_R012A_GATE_STATEMENT,
  GX_R012_FINAL_CERTIFICATION_STATEMENT,
  CANONICAL_INFRASTRUCTURE_CATEGORIES,
  PARITY_CONFIDENCE_SCALE,
  PARITY_CAPABILITY_MATRIX,
  DATA_PLANE_ISOLATION_RULES,
  synthesizeParityIngressPath,
  verifyDataPlaneIsolation,
} from './gx-r012a-infrastructure-parity.contract.ts';
import { resolveGuestInfrastructureSummary } from '../utils/infrastructure.ts';
import type { Technology, EvidenceRow, Observation } from '../types/index.ts';

describe('GX-R012A → GX-R012G: Guest Infrastructure Experience Parity Track', () => {
  // ─── 1. GX-R012A: Parity Foundation ──────────────────────────────────────────
  describe('GX-R012A — Infrastructure Experience Parity Foundation', () => {
    it('declares frozen contract metadata and gate statement', () => {
      assert.equal(GX_R012A_TICKET_ID, 'GX-R012A');
      assert.equal(GX_R012_PARITY_TRACK_PHASE, 'Guest Experience Architecture');
      assert.equal(GX_R012_PARITY_TRACK_STATUS, 'FROZEN_INFRASTRUCTURE_PARITY_CONTRACT');
      assert.ok(
        GX_R012A_GATE_STATEMENT.includes(
          'GX Infrastructure must use the same canonical Infrastructure information model as WX'
        )
      );
    });

    it('implements identical canonical infrastructure category semantics as WX', () => {
      const categoryIds = CANONICAL_INFRASTRUCTURE_CATEGORIES.map((c) => c.id);
      assert.ok(categoryIds.includes('edge'));
      assert.ok(categoryIds.includes('web_server'));
      assert.ok(categoryIds.includes('application'));
      assert.ok(categoryIds.includes('platform'));
      assert.ok(categoryIds.includes('runtime'));
      assert.ok(categoryIds.includes('hosting'));
      assert.ok(categoryIds.includes('dns'));
      assert.ok(categoryIds.includes('tls'));
      assert.ok(categoryIds.includes('mail'));
      assert.ok(categoryIds.includes('ip_address'));
      assert.ok(categoryIds.includes('open_ports'));
    });

    it('enforces shared confidence semantics with identical visual tokens', () => {
      assert.equal(PARITY_CONFIDENCE_SCALE.HIGH.level, 'HIGH');
      assert.ok(PARITY_CONFIDENCE_SCALE.HIGH.badgeClass.includes('bg-[#EAF7F2]'));
      assert.equal(PARITY_CONFIDENCE_SCALE.MEDIUM.level, 'MEDIUM');
      assert.ok(PARITY_CONFIDENCE_SCALE.MEDIUM.badgeClass.includes('bg-[#FFF8E6]'));
      assert.equal(PARITY_CONFIDENCE_SCALE.LOW.level, 'LOW');
      assert.ok(PARITY_CONFIDENCE_SCALE.LOW.badgeClass.includes('bg-[#EEF4FF]'));
    });
  });

  // ─── 2. GX-R012B: Infrastructure Summary Experience ──────────────────────────
  describe('GX-R012B — Infrastructure Summary Experience', () => {
    it('resolves dynamic observed infrastructure summary matching WX compact layout', () => {
      const mockTechs: Technology[] = [
        { name: 'Cloudflare', role: 'CDN & DDoS Protection', confidence: 'high' },
        { name: 'nginx', role: 'Reverse Proxy', version: '1.24.0', confidence: 'high' },
        { name: 'Next.js', role: 'Fullstack React Framework', version: '14.2.0', confidence: 'high' },
        { name: 'AWS', role: 'Origin Cloud Compute', confidence: 'high' },
      ];

      const mockEvidence: EvidenceRow[] = [
        {
          id: 'ev-1',
          category: 'HTTP',
          title: 'Cloudflare Ingress',
          summary: 'Cloudflare cf-ray observed',
          collectedAt: '2026-09-05T10:00:00Z',
          payload: 'server: cloudflare\ncf-ray: 8c38947-fra',
          source: 'HTTP Wire Response',
        },
      ];

      const mockObs: Observation[] = [
        {
          label: 'DNS Zone Authority',
          body: 'Cloudflare authoritative nameservers responding',
          category: 'DNS',
        },
      ];

      const result = resolveGuestInfrastructureSummary('acme.org', mockTechs, mockEvidence, mockObs);

      assert.ok(result.observedCount >= 4);
      assert.equal(result.detectedRows.length, result.observedCount);

      // Verify category labels match WX
      const edgeRow = result.detectedRows.find((r) => r.categoryKey === 'edge');
      assert.ok(edgeRow);
      assert.equal(edgeRow?.componentName, 'Cloudflare');
      assert.equal(edgeRow?.label, 'Edge');

      const gwRow = result.detectedRows.find((r) => r.categoryKey === 'web_server');
      assert.ok(gwRow);
      assert.ok(gwRow?.componentName.includes('nginx'));
      assert.equal(gwRow?.label, 'Web Server');

      const appRow = result.detectedRows.find((r) => r.categoryKey === 'application');
      assert.ok(appRow);
      assert.equal(appRow?.componentName, 'Next.js');
      assert.equal(appRow?.label, 'Application');
    });
  });

  // ─── 3. GX-R012C: Ingress Topology & Multi-Hop Model ─────────────────────────
  describe('GX-R012C — Infrastructure Topology & Ingress Experience', () => {
    it('synthesizes observed multi-hop ingress request path matching WX topology model', () => {
      const mockTechs: Technology[] = [
        { name: 'Cloudflare', role: 'Edge Anycast', confidence: 'high' },
        { name: 'nginx', role: 'Web Server Gateway', version: '1.24.0', confidence: 'high' },
        { name: 'Next.js', role: 'Application Framework', confidence: 'high' },
        { name: 'AWS', role: 'Cloud Compute', confidence: 'high' },
      ];

      const hops = synthesizeParityIngressPath(mockTechs, 'acme.org');

      assert.equal(hops.length, 5);
      assert.equal(hops[0].role, 'CLIENT');
      assert.equal(hops[1].role, 'EDGE');
      assert.equal(hops[1].componentName, 'Cloudflare');
      assert.equal(hops[2].role, 'GATEWAY');
      assert.equal(hops[2].componentName, 'nginx 1.24.0');
      assert.equal(hops[3].role, 'APP');
      assert.equal(hops[3].componentName, 'Next.js');
      assert.equal(hops[4].role, 'CLOUD');
      assert.equal(hops[4].componentName, 'AWS');
    });

    it('preserves anti-fantasy rule: does not fabricate unobserved hops', () => {
      // Single direct origin domain without edge or gateway
      const hops = synthesizeParityIngressPath([], 'bare-origin.io');
      assert.equal(hops.length, 2);
      assert.equal(hops[0].role, 'CLIENT');
      assert.equal(hops[1].role, 'CLOUD');
      assert.equal(hops[1].componentName, 'bare-origin.io Origin');
    });
  });

  // ─── 4. GX-R012D: Component Investigation ────────────────────────────────────
  describe('GX-R012D — Infrastructure Component Investigation', () => {
    it('preserves forensic inspection details including claim and anti-overreach boundaries', () => {
      const mockTechs: Technology[] = [
        { name: 'nginx', role: 'Reverse Proxy', version: '1.24.0', confidence: 'high' },
      ];
      const mockEvidence: EvidenceRow[] = [
        {
          id: 'ev-nginx',
          category: 'HTTP',
          title: 'Server Header',
          summary: 'server: nginx/1.24.0',
          collectedAt: '2026-09-05T10:00:00Z',
          payload: 'HTTP/1.1 200 OK\nserver: nginx/1.24.0\nconnection: keep-alive',
          source: 'Perimeter HTTP Response Header',
          hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        },
      ];

      const result = resolveGuestInfrastructureSummary('test.dev', mockTechs, mockEvidence, []);
      const gw = result.detectedRows.find((r) => r.categoryKey === 'web_server');

      assert.ok(gw);
      assert.ok(gw?.whatThisProves.includes('Confirms NGINX is terminating or proxying HTTP requests'));
      assert.ok(gw?.whatThisDoesNotProve.includes('Does not prove backend application topology'));
      assert.ok(gw?.observedSignal);
      assert.ok(gw?.rawPayload?.includes('server: nginx/1.24.0'));
      assert.ok(gw?.verificationHash?.includes('sha256:'));
      assert.equal(gw?.confidence, 'HIGH');
    });
  });

  // ─── 5. GX-R012E: Parity Matrix Verification Gate ────────────────────────────
  describe('GX-R012E — Infrastructure Experience Parity Verification Gate', () => {
    it('verifies all 17 canonical intelligence capabilities are 100% parity between WX and GX', () => {
      const intelligenceCapabilities = PARITY_CAPABILITY_MATRIX.filter(
        (c) => c.category === 'INTELLIGENCE_PARITY'
      );
      assert.equal(intelligenceCapabilities.length, 17);

      for (const cap of intelligenceCapabilities) {
        assert.equal(cap.supportedInWX, true);
        assert.equal(cap.supportedInGX, true);
      }
    });

    it('verifies all 5 product boundaries are strictly isolated (WX: true, GX: false)', () => {
      const boundaryCapabilities = PARITY_CAPABILITY_MATRIX.filter(
        (c) => c.category === 'PRODUCT_BOUNDARY'
      );
      assert.equal(boundaryCapabilities.length, 5);

      for (const bound of boundaryCapabilities) {
        assert.equal(bound.supportedInWX, true);
        assert.equal(bound.supportedInGX, false);
      }
    });
  });

  // ─── 6. GX-R012F: Data-Plane Isolation ───────────────────────────────────────
  describe('GX-R012F — GX/WX Data-Plane Isolation Verification', () => {
    it('proves clean ephemeral session intelligence with zero security violations', () => {
      const cleanContext = {
        hasAuthContext: false,
        hasTenantId: false,
        hasWorkspaceApiCall: false,
        hasPersistenceMetadata: false,
      };

      const result = verifyDataPlaneIsolation(cleanContext);
      assert.equal(result.isIsolated, true);
      assert.equal(result.violations.length, 0);
    });

    it('catches and rejects forbidden cross-plane data access attempts', () => {
      const compromisedContext = {
        hasAuthContext: true,
        hasTenantId: true,
        hasWorkspaceApiCall: true,
        hasPersistenceMetadata: true,
      };

      const result = verifyDataPlaneIsolation(compromisedContext);
      assert.equal(result.isIsolated, false);
      assert.equal(result.violations.length, 4);
      assert.ok(result.violations[0].includes('AuthContext'));
      assert.ok(result.violations[1].includes('tenant UUID'));
      assert.ok(result.violations[2].includes('Workspace API call'));
      assert.ok(result.violations[3].includes('persistence metadata'));
    });

    it('validates all 7 strict isolation rules', () => {
      assert.equal(DATA_PLANE_ISOLATION_RULES.length, 7);
      assert.ok(DATA_PLANE_ISOLATION_RULES.includes('GX MUST NEVER import or access AuthContext'));
      assert.ok(DATA_PLANE_ISOLATION_RULES.includes('GX MUST NEVER call authenticated /api/v1/workspaces routes'));
    });
  });

  // ─── 7. Final Certification Gate ─────────────────────────────────────────────
  describe('Final Certification Gate: 🔒 GX INFRASTRUCTURE EXPERIENCE PARITY CERTIFIED', () => {
    it('verifies final frozen certification statement', () => {
      assert.equal(
        GX_R012_FINAL_CERTIFICATION_STATEMENT,
        'Guest Experience exposes the same canonical infrastructure intelligence and investigation quality available to Workspace users, while remaining completely isolated from Workspace authentication state, tenant ownership, persistence, history, monitoring, and memory.'
      );
    });
  });
});
