import { BadRequestException } from '@nestjs/common';
import {
  DomainQuotaPolicy,
  MAX_WORKSPACE_DOMAINS,
  WORKSPACE_DOMAIN_LIMIT_ERROR_MESSAGE,
} from './domain-quota-policy';

describe('SEC-GXWX-003 — Domain Quota Policy Contracts & Invariants', () => {
  describe('1. Pure Domain Quota Evaluation', () => {
    it('allows addition when user owns 0 domains (0/4 -> 1/4)', () => {
      const result = DomainQuotaPolicy.evaluateQuota(0, 1);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0);
      expect(result.remainingQuota).toBe(4);
      expect(result.reason).toBe('ADMITTED');
    });

    it('allows addition when user owns 3 domains (3/4 -> 4/4)', () => {
      const result = DomainQuotaPolicy.evaluateQuota(3, 1);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(3);
      expect(result.remainingQuota).toBe(1);
      expect(result.reason).toBe('ADMITTED');
    });

    it('rejects addition when user already owns 4 domains (4/4 -> 5/4)', () => {
      const result = DomainQuotaPolicy.evaluateQuota(4, 1);
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(4);
      expect(result.remainingQuota).toBe(0);
      expect(result.reason).toBe('QUOTA_EXCEEDED');
    });

    it('rejects addition when user owns 5 domains (overflow state)', () => {
      const result = DomainQuotaPolicy.evaluateQuota(5, 1);
      expect(result.allowed).toBe(false);
      expect(result.remainingQuota).toBe(0);
      expect(result.reason).toBe('QUOTA_EXCEEDED');
    });

    it('handles custom quota limits if specified', () => {
      expect(DomainQuotaPolicy.evaluateQuota(1, 1, 2).allowed).toBe(true);
      expect(DomainQuotaPolicy.evaluateQuota(2, 1, 2).allowed).toBe(false);
    });
  });

  describe('2. Authoritative Assertion Guard', () => {
    it('does not throw when within quota (0, 1, 2, 3 existing domains)', () => {
      expect(() => DomainQuotaPolicy.assertAdmissible(0, 1)).not.toThrow();
      expect(() => DomainQuotaPolicy.assertAdmissible(1, 1)).not.toThrow();
      expect(() => DomainQuotaPolicy.assertAdmissible(2, 1)).not.toThrow();
      expect(() => DomainQuotaPolicy.assertAdmissible(3, 1)).not.toThrow();
    });

    it('throws BadRequestException with exact message when user already has 4 domains', () => {
      expect(() => DomainQuotaPolicy.assertAdmissible(4, 1)).toThrow(
        BadRequestException,
      );
      try {
        DomainQuotaPolicy.assertAdmissible(4, 1);
      } catch (err: any) {
        expect(err.message).toBe(WORKSPACE_DOMAIN_LIMIT_ERROR_MESSAGE);
        expect(err.getStatus()).toBe(400);
      }
    });

    it('throws BadRequestException when user attempts to add 2 domains at count 3', () => {
      expect(() => DomainQuotaPolicy.assertAdmissible(3, 2)).toThrow(
        BadRequestException,
      );
    });

    it('guarantees MAX_WORKSPACE_DOMAINS is 4', () => {
      expect(MAX_WORKSPACE_DOMAINS).toBe(4);
      expect(DomainQuotaPolicy.MAX_DOMAINS).toBe(4);
    });
  });
});
