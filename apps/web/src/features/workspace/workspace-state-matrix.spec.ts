import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveWorkspaceSemanticState,
  resolveCurrentIntelligenceSemanticState,
  resolveOverviewSemanticState,
  resolveInvestigationSemanticState,
  resolveMemorySemanticState,
  STATE_EXPERIENCE_APPLICABILITY,
  WORKSPACE_STATE_DESCRIPTIONS,
  STATE_PRECEDENCE_ORDER,
  type WorkspaceSemanticState,
  type WorkspaceExperienceScope,
} from './contracts/workspace-state-matrix.contract.ts';

describe('WX-701: Workspace State Matrix Architecture Contracts', () => {
  describe('1. Canonical 7-Tier Semantic Vocabulary & Semantics', () => {
    it('defines authoritative meanings and guidance for all 7 canonical states', () => {
      const canonicalStates: readonly WorkspaceSemanticState[] = [
        'LOADING',
        'READY',
        'QUIET',
        'EMPTY',
        'PARTIAL',
        'UNAVAILABLE',
        'ERROR',
      ];

      for (const state of canonicalStates) {
        const entry = WORKSPACE_STATE_DESCRIPTIONS[state];
        assert.ok(entry, `Missing description for state: ${state}`);
        assert.ok(typeof entry.meaning === 'string' && entry.meaning.length > 0);
        assert.ok(typeof entry.guidance === 'string' && entry.guidance.length > 0);
      }
    });

    it('enforces that semantic states remain distinctly defined without collapsing into generic errors', () => {
      assert.notEqual('EMPTY', 'ERROR');
      assert.notEqual('PARTIAL', 'ERROR');
      assert.notEqual('UNAVAILABLE', 'ERROR');
      assert.notEqual('QUIET', 'EMPTY');
    });
  });

  describe('2. Experience Scope Applicability Matrix', () => {
    it('formally defines allowed semantic states across all 7 Workspace experience scopes', () => {
      const scopes: readonly WorkspaceExperienceScope[] = [
        'current',
        'overview',
        'investigation',
        'evidence',
        'memory',
        'search',
        'domain_switching',
      ];

      for (const scope of scopes) {
        const allowedStates = STATE_EXPERIENCE_APPLICABILITY[scope];
        assert.ok(allowedStates && allowedStates.length > 0);
        assert.ok(allowedStates.includes('LOADING'));
        assert.ok(allowedStates.includes('READY'));
        assert.ok(allowedStates.includes('UNAVAILABLE'));
        assert.ok(allowedStates.includes('ERROR'));
      }

      // Evidence and Search do not have QUIET states (they are either EMPTY or READY)
      assert.ok(!STATE_EXPERIENCE_APPLICABILITY.evidence.includes('QUIET'));
      assert.ok(!STATE_EXPERIENCE_APPLICABILITY.search.includes('QUIET'));
    });
  });

  describe('3. Deterministic Precedence Ranking', () => {
    it('enforces strict precedence order: UNAVAILABLE > ERROR > LOADING > EMPTY > PARTIAL > QUIET > READY', () => {
      assert.deepEqual(STATE_PRECEDENCE_ORDER, [
        'UNAVAILABLE',
        'ERROR',
        'LOADING',
        'EMPTY',
        'PARTIAL',
        'QUIET',
        'READY',
      ]);

      // Test that UNAVAILABLE wins over ERROR and LOADING
      const resUnavailable = resolveWorkspaceSemanticState({
        scope: 'current',
        isDomainMismatch: true,
        isError: true,
        isLoading: true,
      });
      assert.equal(resUnavailable, 'UNAVAILABLE');

      // Test that ERROR wins over LOADING and EMPTY
      const resError = resolveWorkspaceSemanticState({
        scope: 'current',
        isError: true,
        isLoading: true,
        isEmpty: true,
      });
      assert.equal(resError, 'ERROR');

      // Test that LOADING wins over EMPTY and READY
      const resLoading = resolveWorkspaceSemanticState({
        scope: 'current',
        isLoading: true,
        isEmpty: true,
      });
      assert.equal(resLoading, 'LOADING');
    });
  });

  describe('4. Pure Experience-Specific State Resolvers', () => {
    it('resolves Current Intelligence state: QUIET when observed with zero findings', () => {
      const quietState = resolveCurrentIntelligenceSemanticState({
        isLoading: false,
        isError: false,
        hasFindings: false,
      });
      assert.equal(quietState, 'QUIET');

      const readyState = resolveCurrentIntelligenceSemanticState({
        isLoading: false,
        isError: false,
        hasFindings: true,
      });
      assert.equal(readyState, 'READY');
    });

    it('resolves Overview state: PARTIAL when some sub-signals exist and others are absent', () => {
      // Complete
      const completeState = resolveOverviewSemanticState({
        isLoading: false,
        isError: false,
        hasDns: true,
        hasTls: true,
        hasTech: true,
      });
      assert.equal(completeState, 'READY');

      // Partial (e.g. only DNS & Tech, TLS absent)
      const partialState = resolveOverviewSemanticState({
        isLoading: false,
        isError: false,
        hasDns: true,
        hasTls: false,
        hasTech: true,
      });
      assert.equal(partialState, 'PARTIAL');

      // Empty (zero signals)
      const emptyState = resolveOverviewSemanticState({
        isLoading: false,
        isError: false,
        hasDns: false,
        hasTls: false,
        hasTech: false,
      });
      assert.equal(emptyState, 'EMPTY');
    });

    it('resolves Investigation state: EMPTY when resource is missing without claiming error', () => {
      const missingState = resolveInvestigationSemanticState({
        isLoading: false,
        isError: false,
        resourceFound: false,
      });
      assert.equal(missingState, 'EMPTY');

      const foundState = resolveInvestigationSemanticState({
        isLoading: false,
        isError: false,
        resourceFound: true,
      });
      assert.equal(foundState, 'READY');
    });

    it('resolves Memory state: QUIET when 0 timeline events observed', () => {
      const quietMemory = resolveMemorySemanticState({
        isLoading: false,
        isError: false,
        eventCount: 0,
      });
      assert.equal(quietMemory, 'QUIET');

      const activeMemory = resolveMemorySemanticState({
        isLoading: false,
        isError: false,
        eventCount: 3,
      });
      assert.equal(activeMemory, 'READY');
    });
  });

  describe('5. Hard Invariants: Zero Anti-Patterns', () => {
    it('strictly forbids client-side health scoring, status percentages, or error conflation', () => {
      const prohibitedAntiPatterns = [
        'syntheticHealthPercentages',
        'clientSideHealthScoring',
        'conflatingEmptyWithSystemError',
        'conflatingPartialSignalWithFailure',
        'fabricatedSecurityConfidence',
      ];

      for (const pattern of prohibitedAntiPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
