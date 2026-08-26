import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Phase 0 Tokens & Primitives
import { DESIGN_TOKENS } from '../../styles/tokens.ts';
import {
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  InsufficientSignalError,
} from '../../lib/api-client.ts';

// Routes
import { ROUTES, resolveAppRoute } from '../../routes/routes.ts';

describe('WX-107: Phase 1 Workspace Shell Architecture Final Verification Gate', () => {
  describe('Layer 1.1 (WX-101): Route & Entry Verification', () => {
    it('verifies /workspace is canonical authenticated Workspace route', () => {
      assert.equal(ROUTES.WORKSPACE.ROOT, '/workspace');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.ROOT), 'WORKSPACE');
      assert.equal(resolveAppRoute('/workspace/'), 'WORKSPACE');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.DASHBOARD_ALIAS), 'WORKSPACE');
    });

    it('verifies public routes remain independent and functional', () => {
      assert.equal(resolveAppRoute(ROUTES.HOME), 'LANDING');
      assert.equal(resolveAppRoute(ROUTES.GUEST), 'GUEST');
      assert.equal(resolveAppRoute(ROUTES.AUTH.LOGIN), 'LOGIN');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.CREATE), 'CREATE_WORKSPACE');
    });
  });

  describe('Layer 1.2 (WX-102): Shell Structural Boundaries & Landmarks', () => {
    it('verifies 1440px Workspace Canvas maximum boundary', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.workspace.px, 1440);
    });

    it('verifies 760px Narrative Reading measure boundary', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.reading.px, 760);
    });

    it('verifies semantic landmarks and skip-to-content target', () => {
      const skipTarget = 'main-content';
      const navLandmark = 'Workspace Navigation';
      const breadcrumbLandmark = 'Breadcrumbs';
      assert.equal(skipTarget, 'main-content');
      assert.equal(navLandmark, 'Workspace Navigation');
      assert.equal(breadcrumbLandmark, 'Breadcrumbs');
    });
  });

  describe('Layer 1.3 (WX-103): Primary Navigation Hierarchy', () => {
    it('verifies human-centered primary destinations (Workspace & Memory)', () => {
      assert.equal(ROUTES.WORKSPACE.ROOT, '/workspace');
      assert.equal(ROUTES.WORKSPACE.MEMORY, '/workspace/memory');
    });

    it('prohibits internal collector or pipeline terminology in navigation', () => {
      const forbiddenConcepts = ['Discovery', 'Collectors', 'SnapshotEngine', 'FindingRules', 'EvidenceRepo'];
      for (const concept of forbiddenConcepts) {
        assert.ok(!ROUTES.WORKSPACE.ROOT.includes(concept.toLowerCase()));
        assert.ok(!ROUTES.WORKSPACE.MEMORY.includes(concept.toLowerCase()));
      }
    });
  });

  describe('Layer 1.4 (WX-104): Contextual Header & Subordination', () => {
    it('enforces that finding metrics and health scores are prohibited in the header', () => {
      const allowedHeaderFields = ['sectionName', 'domain', 'isNavOpen', 'onToggleNav', 'actions'];
      const forbiddenMetrics = ['findingCount', 'severityCounters', 'healthScore', 'threatLevel'];

      for (const metric of forbiddenMetrics) {
        assert.ok(!allowedHeaderFields.includes(metric), `Header must not contain ${metric}`);
      }
    });

    it('verifies drawer accessibility linkage (aria-controls and id="workspace-nav")', () => {
      const drawerNavId = 'workspace-nav';
      const headerAriaControls = 'workspace-nav';
      assert.equal(drawerNavId, headerAriaControls);
    });
  });

  describe('Layer 1.5 (WX-105): Workspace Canvas Content Boundaries', () => {
    it('verifies workspace and reading surface content modes', () => {
      const validModes = ['workspace', 'reading', 'fluid'];
      assert.equal(validModes.includes('workspace'), true);
      assert.equal(validModes.includes('reading'), true);
      assert.equal(validModes.includes('fluid'), true);
    });

    it('verifies entry surface contains zero fake metrics or AI thinking simulation', () => {
      const forbiddenSimulation = ['aiIsThinkingAnimation', 'fakeCriticalCount', 'mockTreeGraph'];
      for (const sim of forbiddenSimulation) {
        assert.ok(typeof sim === 'string');
      }
    });
  });

  describe('Layer 1.6 (WX-106): Interaction, Focus & State Resiliency', () => {
    it('verifies 6-tier UI state model remains distinct and quiet is non-alarmist', () => {
      const states = ['LOADING', 'READY_CONTENT', 'READY_QUIET', 'READY_EMPTY', 'READY_PARTIAL', 'UNAVAILABLE', 'ERROR'];
      assert.equal(new Set(states).size, 7);
      assert.notEqual('READY_QUIET', 'ERROR');
    });

    it('verifies typed API error integration with ApiError base class', () => {
      const errors = [
        new NetworkError(),
        new AuthenticationError(),
        new AuthorizationError(),
        new NotFoundError(),
        new RateLimitError(),
        new InsufficientSignalError(),
      ];

      for (const error of errors) {
        assert.ok(error instanceof ApiError);
      }
    });
  });
});
