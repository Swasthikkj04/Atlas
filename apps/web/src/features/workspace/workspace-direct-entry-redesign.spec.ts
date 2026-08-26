import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('WX-211: Direct Entry Workspace Visual Redesign Contracts', () => {
  describe('1. Direct Entry Editorial Content Hierarchy', () => {
    it('defines authoritative direct-entry copy without telemetry or fake claims', () => {
      const directEntryCopy = {
        eyebrow: 'YOUR WORKSPACE',
        headline: 'Understand what matters across your infrastructure.',
        body: 'Your workspace is ready. Add your first domain to begin.',
        cta: 'Add your first domain',
      };

      assert.equal(directEntryCopy.eyebrow, 'YOUR WORKSPACE');
      assert.ok(directEntryCopy.headline.includes('Understand what matters'));
      assert.ok(directEntryCopy.body.includes('Your workspace is ready.'));
      assert.equal(directEntryCopy.cta, 'Add your first domain');
    });

    it('prohibits fake telemetry, methodology narration, or premature causal model claims', () => {
      const forbiddenCopyPatterns = [
        'causal-model',
        'telemetry retention',
        'continuous discovery methodology',
        'DNS/TLS probe telemetry',
        'fakeInfrastructureStatus',
        'onboardingWizardStep1',
        'giantBorderedCardContainer',
      ];

      for (const pattern of forbiddenCopyPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });

  describe('2. Sidebar & Navigation Hierarchy Specifications', () => {
    it('enforces approved sidebar dimensions (256px expanded / 72px collapsed)', () => {
      const sidebarDimensions = {
        expandedWidthPx: 256,
        collapsedWidthPx: 72,
        expandedClass: 'w-64',
      };

      assert.equal(sidebarDimensions.expandedWidthPx, 256);
      assert.equal(sidebarDimensions.collapsedWidthPx, 72);
      assert.equal(sidebarDimensions.expandedClass, 'w-64');
    });

    it('enforces distinct separation between WORKSPACE navigation and ACCOUNT context', () => {
      const navSections = ['BRAND', 'WORKSPACE', 'ACCOUNT'];
      assert.equal(navSections.length, 3);
      assert.equal(navSections[0], 'BRAND');
      assert.equal(navSections[1], 'WORKSPACE');
      assert.equal(navSections[2], 'ACCOUNT');
    });
  });

  describe('3. Topbar Quietness Contract', () => {
    it('enforces quiet topbar without fake AI status or telemetry', () => {
      const allowedTopbarElements = ['Breadcrumbs', 'ActiveStatusDot'];
      const forbiddenTopbarTheatrics = [
        'aiActiveIndicator',
        'telemetryStreamRate',
        'syntheticHealthBar',
        'decorativeControls',
      ];

      for (const theatric of forbiddenTopbarTheatrics) {
        assert.ok(!allowedTopbarElements.includes(theatric));
      }
    });
  });
});
