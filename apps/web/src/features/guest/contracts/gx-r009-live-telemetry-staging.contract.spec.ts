import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R009_TICKET_ID,
  GX_R009_PHASE,
  GX_R009_STATUS,
  GX_R009_FROZEN_PRINCIPLE,
  GX_R009_CERTIFICATION_GATE_STATEMENT,
  TELEMETRY_FOUR_LAYERS,
  COGNITIVE_TELEMETRY_STAGES,
  SPATIAL_EMERGENCE_FLOW,
  STALLED_DISCOVERY_COPY,
  FAILED_DISCOVERY_COPY,
  EXPLICITLY_REJECTED_TELEMETRY_PATTERNS,
  validateTelemetryStaging,
  verifyGXR009CertificationGate,
} from './gx-r009-live-telemetry-staging.contract.ts';

describe('GX-R009: Live Telemetry & Discovery Staging Contract', () => {
  describe('1. Canonical Metadata & Principles', () => {
    it('defines ticket metadata and status', () => {
      assert.equal(GX_R009_TICKET_ID, 'GX-R009');
      assert.equal(GX_R009_PHASE, 'Guest Experience Redesign');
      assert.equal(GX_R009_STATUS, 'FROZEN_TELEMETRY_STAGING_CONTRACT');
    });

    it('embodies the frozen discovery principle', () => {
      assert.equal(GX_R009_FROZEN_PRINCIPLE, 'Show Nebula thinking, not Nebula scanning.');
    });

    it('passes the 🔒 GX-R009 Acceptance Gate with canonical statement', () => {
      const statement =
        'A guest can watch Nebula transition from intent into live infrastructure understanding and perceive meaningful progress without being presented with scanner mechanics, fake telemetry, or visual noise.';
      const result = verifyGXR009CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R009_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement proposing scanner checklist with fake delays', () => {
      const statement = 'A scanner checklist with rotating 3D globe and progress percentage counter.';
      const result = verifyGXR009CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Four-Layer Telemetry Composition Architecture', () => {
    it('defines all 4 distinct visual layers', () => {
      assert.equal(TELEMETRY_FOUR_LAYERS.length, 4);
      const layerIds = TELEMETRY_FOUR_LAYERS.map((l) => l.layerId);
      assert.deepEqual(layerIds, ['LAYER_A', 'LAYER_B', 'LAYER_C', 'LAYER_D']);
    });

    it('preserves Layer A persistent domain context anchor in monospace typography', () => {
      const layerA = TELEMETRY_FOUR_LAYERS.find((l) => l.layerId === 'LAYER_A');
      assert.ok(layerA);
      assert.ok(layerA.typography.includes('Mono'));
      assert.ok(layerA.requiredContent.includes('{domain}'));
    });

    it('uses display serif for Layer B primary cognitive statement', () => {
      const layerB = TELEMETRY_FOUR_LAYERS.find((l) => l.layerId === 'LAYER_B');
      assert.ok(layerB);
      assert.ok(layerB.typography.includes('Newsreader serif'));
      assert.equal(layerB.motionTier, 'LEVEL_2_INTERFACE');
    });

    it('provides Layer D system baseline in monospace typography', () => {
      const layerD = TELEMETRY_FOUR_LAYERS.find((l) => l.layerId === 'LAYER_D');
      assert.ok(layerD);
      assert.ok(layerD.typography.includes('JetBrains Mono'));
      assert.ok(layerD.requiredContent.includes('LIVE'));
    });
  });

  describe('3. Cognitive Telemetry Stages & Backend Truth Sources', () => {
    it('defines 4 backend-truth driven cognitive stages', () => {
      assert.equal(COGNITIVE_TELEMETRY_STAGES.length, 4);
      const ids = COGNITIVE_TELEMETRY_STAGES.map((s) => s.id);
      assert.deepEqual(ids, [
        'stage_perimeter',
        'stage_infrastructure',
        'stage_signals',
        'stage_synthesis',
      ]);
    });

    it('binds each cognitive stage to a concrete backend truth source', () => {
      COGNITIVE_TELEMETRY_STAGES.forEach((stage) => {
        assert.ok(stage.statement.endsWith('.'));
        assert.ok(stage.backendTruthSource.length > 15);
        assert.ok(stage.context.length > 20);
      });
    });
  });

  describe('4. Spatial Emergence Progression', () => {
    it('defines 5-step spatial emergence flow avoiding abrupt card walls', () => {
      assert.equal(SPATIAL_EMERGENCE_FLOW.length, 5);
      assert.deepEqual(SPATIAL_EMERGENCE_FLOW, [
        'UNDERSTANDING_DISCOVERY',
        'FIRST_SIGNAL_CRYSTALLIZATION',
        'CURRENT_UNDERSTANDING_EXECUTIVE_BRIEF',
        'WHAT_DESERVES_ATTENTION_OBSERVATIONS',
        'INFRASTRUCTURE_ARCHITECTURE_MATRIX',
      ]);
    });
  });

  describe('5. Stalled & Failed Discovery Resilience', () => {
    it('provides calm copy for slow discovery without percentage counters', () => {
      assert.equal(STALLED_DISCOVERY_COPY.primary, 'Nebula is still forming the understanding.');
      assert.ok(!STALLED_DISCOVERY_COPY.primary.includes('%'));
      assert.ok(!STALLED_DISCOVERY_COPY.primary.includes('Scanning'));
    });

    it('provides calm retry action on failure without stack traces', () => {
      assert.equal(FAILED_DISCOVERY_COPY.primary, "Nebula couldn't complete this understanding.");
      assert.equal(FAILED_DISCOVERY_COPY.action, 'Try again →');
    });
  });

  describe('6. Explicitly Rejected Scanner & Gimmick Patterns', () => {
    it('enumerates all 11 rejected telemetry patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_TELEMETRY_PATTERNS.length, 11);
      assert.ok(EXPLICITLY_REJECTED_TELEMETRY_PATTERNS.some((p) => p.includes('Radar animation')));
      assert.ok(EXPLICITLY_REJECTED_TELEMETRY_PATTERNS.some((p) => p.includes('Rotating 3D wireframe globe')));
      assert.ok(EXPLICITLY_REJECTED_TELEMETRY_PATTERNS.some((p) => p.includes('Progress percentage bars')));
      assert.ok(EXPLICITLY_REJECTED_TELEMETRY_PATTERNS.some((p) => p.includes('Check counters')));
      assert.ok(EXPLICITLY_REJECTED_TELEMETRY_PATTERNS.some((p) => p.includes('Security scanner checkmark lists')));
      assert.ok(EXPLICITLY_REJECTED_TELEMETRY_PATTERNS.some((p) => p.includes('Fake matrix rain')));
    });
  });

  describe('7. Telemetry Staging Configuration Validator', () => {
    it('validates a compliant live telemetry configuration', () => {
      const result = validateTelemetryStaging({
        hasRadarAnimation: false,
        hasRotatingGlobe: false,
        hasProgressPercentage: false,
        hasChecklistProgress: false,
        hasTerminalMatrixRain: false,
        hasFullPageLoader: false,
        hasArtificialDelays: false,
        preservesDomainAnchor: true,
        isBackendTruthDriven: true,
        supportsSpatialEmergence: true,
        usesPoliteAriaLive: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects rotating globe gimmicks', () => {
      const result = validateTelemetryStaging({
        hasRadarAnimation: false,
        hasRotatingGlobe: true,
        hasProgressPercentage: false,
        hasChecklistProgress: false,
        hasTerminalMatrixRain: false,
        hasFullPageLoader: false,
        hasArtificialDelays: false,
        preservesDomainAnchor: true,
        isBackendTruthDriven: true,
        supportsSpatialEmergence: true,
        usesPoliteAriaLive: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Rotating 3D globe'));
    });

    it('rejects checklist progress tickers', () => {
      const result = validateTelemetryStaging({
        hasRadarAnimation: false,
        hasRotatingGlobe: false,
        hasProgressPercentage: false,
        hasChecklistProgress: true,
        hasTerminalMatrixRain: false,
        hasFullPageLoader: false,
        hasArtificialDelays: false,
        preservesDomainAnchor: true,
        isBackendTruthDriven: true,
        supportsSpatialEmergence: true,
        usesPoliteAriaLive: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Checklist tick-boxes'));
    });
  });
});
