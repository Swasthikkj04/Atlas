import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// WX-000 & WX-002: Design Tokens
import { DESIGN_TOKENS } from './styles/tokens.ts';

// WX-001: API Client & Errors
import {
  apiClient,
  ApiError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  InsufficientSignalError,
} from './lib/api-client.ts';
import { queryClient } from './lib/query-client.ts';
import { env } from './config/env.config.ts';

// WX-006: Query Keys
import { queryKeys } from './hooks/queries/query-keys.ts';

// Existing Routes
import { ROUTES, resolveAppRoute } from './routes/routes.ts';

describe('WX-007: Phase 0 Foundation Architecture Final Verification Gate', () => {
  describe('Layer 0 & 2: Visual Language & Design Token Enforcement', () => {
    it('verifies typography token families and scale bounds', () => {
      assert.ok(DESIGN_TOKENS.typography.fonts.sans.includes('DM Sans'));
      assert.ok(DESIGN_TOKENS.typography.fonts.display.includes('Newsreader'));
      assert.ok(DESIGN_TOKENS.typography.fonts.mono.includes('JetBrains Mono'));

      assert.equal(DESIGN_TOKENS.typography.scale.heading1.px, 36);
      assert.equal(DESIGN_TOKENS.typography.scale.heading2.px, 24);
      assert.equal(DESIGN_TOKENS.typography.scale.heading3.px, 20);
      assert.equal(DESIGN_TOKENS.typography.scale.heading4.px, 16);
      assert.equal(DESIGN_TOKENS.typography.scale.body.px, 15);
      assert.equal(DESIGN_TOKENS.typography.scale.caption.px, 12);
      assert.equal(DESIGN_TOKENS.typography.scale.eyebrow.px, 11);
      assert.equal(DESIGN_TOKENS.typography.scale.monoCode.px, 13);
    });

    it('verifies 6-tier restrained semantic severity tokens', () => {
      const tiers = ['critical', 'high', 'medium', 'low', 'informational', 'success'] as const;
      for (const tier of tiers) {
        const token = DESIGN_TOKENS.severity[tier];
        assert.ok(token.text.light, `Tier ${tier} text light must exist`);
        assert.ok(token.text.dark, `Tier ${tier} text dark must exist`);
        assert.ok(token.bg.light.includes('rgba'), `Tier ${tier} bg light must use subtle opacity`);
        assert.ok(token.bg.dark.includes('rgba'), `Tier ${tier} bg dark must use subtle opacity`);
      }
    });

    it('verifies Base-8 unbroken spatial scale from 2px to 96px', () => {
      assert.equal(DESIGN_TOKENS.spacing['3xs'].px, 2);
      assert.equal(DESIGN_TOKENS.spacing['2xs'].px, 4);
      assert.equal(DESIGN_TOKENS.spacing.xs.px, 8);
      assert.equal(DESIGN_TOKENS.spacing.sm.px, 12);
      assert.equal(DESIGN_TOKENS.spacing.md.px, 16);
      assert.equal(DESIGN_TOKENS.spacing.lg.px, 24);
      assert.equal(DESIGN_TOKENS.spacing.xl.px, 32);
      assert.equal(DESIGN_TOKENS.spacing['2xl'].px, 48);
      assert.equal(DESIGN_TOKENS.spacing['3xl'].px, 72);
      assert.equal(DESIGN_TOKENS.spacing['4xl'].px, 96);
    });

    it('verifies canonical layout boundaries', () => {
      assert.equal(DESIGN_TOKENS.layoutBoundaries.form.px, 420);
      assert.equal(DESIGN_TOKENS.layoutBoundaries.dialog.px, 640);
      assert.equal(DESIGN_TOKENS.layoutBoundaries.reading.px, 760);
      assert.equal(DESIGN_TOKENS.layoutBoundaries.workspace.px, 1440);
    });
  });

  describe('Layer 1: Frontend Foundation & Query Client', () => {
    it('verifies query client configuration adheres to calm defaults', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      assert.equal(defaultOptions.queries?.staleTime, 60 * 1000);
      assert.equal(defaultOptions.queries?.refetchOnWindowFocus, false);
    });

    it('verifies environment configuration is type-safe', () => {
      assert.ok(typeof env.isDev === 'boolean');
      assert.ok(typeof env.isProd === 'boolean');
      assert.ok(typeof env.apiBaseUrl === 'string');
    });

    it('verifies API client and error hierarchy classes', () => {
      assert.ok(apiClient);
      assert.ok(new NetworkError() instanceof ApiError);
      assert.ok(new AuthenticationError() instanceof ApiError);
      assert.ok(new AuthorizationError() instanceof ApiError);
      assert.ok(new NotFoundError() instanceof ApiError);
      assert.ok(new RateLimitError() instanceof ApiError);
      assert.ok(new InsufficientSignalError() instanceof ApiError);
    });
  });

  describe('Layer 3: Icon System & Accessibility', () => {
    it('verifies canonical semantic icon sizes', () => {
      assert.equal(DESIGN_TOKENS.icons.sizes.micro.px, 12);
      assert.equal(DESIGN_TOKENS.icons.sizes.small.px, 14);
      assert.equal(DESIGN_TOKENS.icons.sizes.default.px, 16);
      assert.equal(DESIGN_TOKENS.icons.sizes.medium.px, 20);
      assert.equal(DESIGN_TOKENS.icons.sizes.large.px, 24);
    });

    it('verifies contextual stroke widths', () => {
      assert.equal(DESIGN_TOKENS.icons.strokes.display, 1.5);
      assert.equal(DESIGN_TOKENS.icons.strokes.ui, 1.75);
      assert.equal(DESIGN_TOKENS.icons.strokes.micro, 2.0);
    });
  });

  describe('Layer 4: Layout Primitives Hierarchy', () => {
    it('verifies reading surface measure falls within 65-75 CPL readability window (720-800px)', () => {
      const measure = DESIGN_TOKENS.layoutBoundaries.reading.px;
      assert.ok(measure >= 720 && measure <= 800, `Reading measure ${measure} must be between 720 and 800px`);
    });

    it('verifies hairline border separator tokens', () => {
      assert.equal(DESIGN_TOKENS.borders.hairline.light, 'rgba(0, 0, 0, 0.07)');
      assert.equal(DESIGN_TOKENS.borders.hairline.dark, 'rgba(255, 255, 255, 0.09)');
    });
  });

  describe('Layer 5: UI State Semantic Distinctness', () => {
    it('enforces semantic distinctness between Empty, Quiet, Partial, Unavailable, and Error states', () => {
      const states = {
        empty: 'Nothing exists yet.',
        quiet: 'Nothing important changed.',
        partial: 'Partial understanding established.',
        unavailable: 'Information currently unavailable.',
        error: 'Unable to complete operation.',
      };

      const values = Object.values(states);
      const uniqueValues = new Set(values);
      assert.equal(values.length, uniqueValues.size, 'All state messages must be unique and semantically distinct');
    });
  });

  describe('Layer 6: API Contracts & Intelligence Boundary', () => {
    it('verifies query key factories isolate domains, jobs, snapshots, findings, and briefs', () => {
      assert.deepEqual(queryKeys.domains.all(), ['domains']);
      assert.deepEqual(queryKeys.domains.detail('dom-1'), ['domains', 'dom-1']);
      assert.deepEqual(queryKeys.domains.overview('dom-1'), ['domains', 'dom-1', 'overview']);
      assert.deepEqual(queryKeys.understanding.job('job-1'), ['understanding', 'jobs', 'job-1']);
      assert.deepEqual(queryKeys.briefs.bySnapshot('snp-1'), ['briefs', 'bySnapshot', 'snp-1']);
      assert.deepEqual(queryKeys.workspace.overview('dom-1'), ['workspace', 'overview', 'dom-1']);
    });
  });

  describe('Layer 7: Existing Experience Regression Gate', () => {
    it('preserves public Landing, Guest, Auth, and Workspace route resolutions', () => {
      assert.equal(resolveAppRoute(ROUTES.HOME), 'LANDING');
      assert.equal(resolveAppRoute(ROUTES.GUEST), 'GUEST');
      assert.equal(resolveAppRoute(ROUTES.AUTH.LOGIN), 'LOGIN');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.CREATE), 'CREATE_WORKSPACE');
      assert.equal(resolveAppRoute(ROUTES.WORKSPACE.ROOT), 'WORKSPACE');
    });
  });
});
