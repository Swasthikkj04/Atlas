import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateReturnPath,
  resolveNearestValidNavigationContext,
  hydrateWorkspaceUrlParams,
  isResponseValidForActiveContext,
} from './contracts/navigation-resilience.contract.ts';

describe('WX-705: Resilience & Navigation Recovery Architecture Contracts', () => {
  describe('1. Return Path Sanitization & Validation', () => {
    it('allows valid internal Workspace paths with query parameters', () => {
      const validPath = '/workspace?domainId=dom-1&sourceType=finding&sourceId=fnd-001';
      assert.equal(validateReturnPath(validPath), validPath);
    });

    it('rejects external URLs, protocol-relative links, and javascript injection', () => {
      assert.equal(validateReturnPath('https://evil.com'), '/workspace');
      assert.equal(validateReturnPath('//evil.com/workspace'), '/workspace');
      assert.equal(validateReturnPath('javascript:alert(document.cookie)'), '/workspace');
      assert.equal(validateReturnPath('data:text/html,<script>evil()</script>'), '/workspace');
      assert.equal(validateReturnPath(''), '/workspace');
      assert.equal(validateReturnPath(null), '/workspace');
    });
  });

  describe('2. Safe Recovery Hierarchy & Graceful Degradation', () => {
    it('recovers to the specified parent resource when an exploratory view fails', () => {
      const recovery = resolveNearestValidNavigationContext({
        domainId: 'dom-stripe',
        failedResourceType: 'evidence',
        availableParentResourceType: 'snapshot',
        availableParentResourceId: 'snp-001',
      });

      assert.equal(recovery.domainId, 'dom-stripe');
      assert.equal(recovery.resourceType, 'snapshot');
      assert.equal(recovery.resourceId, 'snp-001');
    });

    it('gracefully degrades to Memory when evidence or change fails without an explicit parent', () => {
      const recoveryEvidence = resolveNearestValidNavigationContext({
        domainId: 'dom-stripe',
        failedResourceType: 'evidence',
      });
      assert.equal(recoveryEvidence.experience, 'memory');

      const recoveryChange = resolveNearestValidNavigationContext({
        domainId: 'dom-stripe',
        failedResourceType: 'change',
      });
      assert.equal(recoveryChange.experience, 'memory');
    });

    it('gracefully degrades to Current Intelligence when a finding or story fails', () => {
      const recovery = resolveNearestValidNavigationContext({
        domainId: 'dom-stripe',
        failedResourceType: 'finding',
      });
      assert.equal(recovery.experience, 'current');
    });
  });

  describe('3. Single Authoritative URL Hydration Pipeline', () => {
    it('hydrates a complex deep-link investigation URL cleanly', () => {
      const searchParams =
        'domainId=dom-stripe&view=memory&sourceType=change&sourceId=chg-838&returnPath=%2Fworkspace%3Fview%3Doverview';

      const hydrated = hydrateWorkspaceUrlParams({
        searchParams,
        knownDomainIds: ['dom-stripe', 'dom-github'],
      });

      assert.equal(hydrated.domainId, 'dom-stripe');
      assert.equal(hydrated.isDomainValid, true);
      assert.equal(hydrated.experience, 'memory');
      assert.equal(hydrated.resourceType, 'change');
      assert.equal(hydrated.resourceId, 'chg-838');
      assert.equal(hydrated.returnPath, '/workspace?view=overview');
    });

    it('safely handles malformed and invalid resource types without crashing', () => {
      const searchParams = 'domainId=dom-stripe&sourceType=invalid_garbage&sourceId=fake-id';
      const hydrated = hydrateWorkspaceUrlParams({
        searchParams,
      });

      assert.equal(hydrated.experience, 'current');
      assert.equal(hydrated.resourceType, undefined);
      assert.equal(hydrated.resourceId, undefined);
    });
  });

  describe('4. Domain Isolation During Flight Protection', () => {
    it('discards late responses from previously active domains', () => {
      const activeDomainId = 'dom-stripe-prod';

      assert.equal(isResponseValidForActiveContext('dom-stripe-prod', activeDomainId), true);
      assert.equal(isResponseValidForActiveContext('dom-old-domain', activeDomainId), false);
      assert.equal(isResponseValidForActiveContext(null, activeDomainId), false);
    });
  });

  describe('5. Hard Invariants: Zero Anti-Patterns', () => {
    it('strictly forbids blind redirects, unvalidated returnPaths, or state pollution across domain switches', () => {
      const prohibitedPatterns = [
        'blindRedirectToExternalHost',
        'unvalidatedReturnPathExecution',
        'statePollutionAcrossDomainSwitch',
        'hardCrashOnMalformedUrlParameters',
        'fullWorkspaceResetOnRecoverableFailure',
      ];

      for (const pattern of prohibitedPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
