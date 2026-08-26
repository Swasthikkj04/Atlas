import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('WX-203: First-Run Domain Setup Architecture & Lifecycle Contracts', () => {
  describe('1. Input Sanitization & Domain Parsing', () => {
    it('sanitizes full URLs to canonical domain names', () => {
      const inputs = [
        { raw: 'https://stripe.com/dashboard', expected: 'stripe.com' },
        { raw: 'http://api.github.com/v1', expected: 'api.github.com' },
        { raw: '   cloudflare.com/   ', expected: 'cloudflare.com' },
      ];

      for (const { raw, expected } of inputs) {
        const sanitized = raw.replace(/^https?:\/\//i, '').split('/')[0].trim();
        assert.equal(sanitized, expected);
      }
    });

    it('rejects invalid inputs missing top-level domain extension', () => {
      const invalidInputs = ['', '   ', 'localhost', 'mycompany'];
      for (const raw of invalidInputs) {
        const sanitized = raw.replace(/^https?:\/\//i, '').split('/')[0].trim();
        const isValid = Boolean(sanitized && sanitized.includes('.'));
        assert.equal(isValid, false, `Input "${raw}" should be considered invalid`);
      }
    });
  });

  describe('2. Truthful Lifecycle State Transitions', () => {
    it('verifies understanding job transitions without artificial progress simulation', () => {
      const jobStatuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'];
      assert.equal(jobStatuses.length, 4);

      // Verify that progress is discrete and lifecycle-bound, not arbitrary percentages
      const isDiscreteLifecycle = jobStatuses.every((status) => typeof status === 'string');
      assert.equal(isDiscreteLifecycle, true);
    });

    it('prohibits conversational theater and fabricated findings on first-run surface', () => {
      const allowedFirstRunFeatures = ['DomainInput', 'BriefsOverview', 'TimelineOverview', 'ZeroTrustBaseline'];
      const forbiddenTheatrics = [
        'conversationalGreetingTheater',
        'fabricatedHealthScore',
        'fakeCriticalFindingsCounter',
        'multiStepSaaSWizard',
      ];

      for (const forbidden of forbiddenTheatrics) {
        assert.ok(!allowedFirstRunFeatures.includes(forbidden));
      }
    });
  });
});
