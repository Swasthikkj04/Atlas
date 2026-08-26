import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTenantDomainAccess,
  validateSnapshotLineageIsolation,
  validateSearchIsolation,
  formatSanitizedSecurityLog,
  SECURITY_HARD_INVARIANTS,
} from './contracts/security.contract.ts';

describe('WX-802: Security Hardening & Tenant Isolation Architecture Specifications', () => {
  describe('1. Tenant Domain Boundary & Access Control', () => {
    it('permits domain navigation when domain ID is owned by authenticated tenant', () => {
      const result = validateTenantDomainAccess({
        requestedDomainId: 'dom-user-owned-1',
        userOwnedDomainIds: ['dom-user-owned-1', 'dom-user-owned-2'],
      });

      assert.equal(result.isPermitted, true);
      assert.equal(result.reason, undefined);
    });

    it('strictly denies domain navigation when attempting to access a foreign tenant domain (IDOR prevention)', () => {
      const result = validateTenantDomainAccess({
        requestedDomainId: 'dom-foreign-tenant-99',
        userOwnedDomainIds: ['dom-user-owned-1', 'dom-user-owned-2'],
      });

      assert.equal(result.isPermitted, false);
      assert.equal(result.reason, 'UNAUTHORIZED_CROSS_TENANT_DOMAIN');
      assert.equal(result.sanitizedTarget, '/workspace');
    });

    it('rejects empty or malformed domain IDs', () => {
      const result = validateTenantDomainAccess({
        requestedDomainId: '',
        userOwnedDomainIds: ['dom-user-owned-1'],
      });

      assert.equal(result.isPermitted, false);
      assert.equal(result.reason, 'INVALID_DOMAIN_ID');
    });
  });

  describe('2. Snapshot Lineage Isolation', () => {
    it('allows lineage tracking when parent and child belong to the same domain', () => {
      assert.equal(
        validateSnapshotLineageIsolation({
          parentDomainId: 'dom-stripe',
          childDomainId: 'dom-stripe',
        }),
        true
      );
    });

    it('strictly blocks attempts to stitch snapshot lineage across different domains', () => {
      assert.equal(
        validateSnapshotLineageIsolation({
          parentDomainId: 'dom-stripe',
          childDomainId: 'dom-competitor',
        }),
        false
      );
    });
  });

  describe('3. Global Search Tenant Isolation', () => {
    it('allows search within authenticated tenant scope', () => {
      assert.equal(
        validateSearchIsolation({
          searchTenantId: 'usr-tenant-123',
          authenticatedTenantId: 'usr-tenant-123',
        }),
        true
      );
    });

    it('strictly denies cross-tenant search execution', () => {
      assert.equal(
        validateSearchIsolation({
          searchTenantId: 'usr-tenant-456',
          authenticatedTenantId: 'usr-tenant-123',
        }),
        false
      );
    });
  });

  describe('4. Operational Log Sanitization & Secret Masking', () => {
    it('emits sanitized diagnostic logs without leaking stack traces or internal secrets', () => {
      const log = formatSanitizedSecurityLog({
        operation: 'DOMAIN_DISCOVERY_FETCH',
        correlationId: 'corr_sec_8291',
        tenantId: 'usr-1',
        rawError: new Error('SELECT * FROM users WHERE password="supersecretpassword"'),
      });

      assert.ok(log.logMessage.includes('Operation=DOMAIN_DISCOVERY_FETCH'));
      assert.ok(log.logMessage.includes('CorrelationId=corr_sec_8291'));
      assert.ok(!log.logMessage.includes('supersecretpassword'));
      assert.ok(!log.logMessage.includes('SELECT *'));
    });
  });

  describe('5. P0 Security Hard Invariants Certification', () => {
    it('certifies all 10 canonical security hard invariants', () => {
      assert.equal(SECURITY_HARD_INVARIANTS.length, 10);
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_CROSS_TENANT_DATA_ACCESS'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_IDOR_VULNERABILITY'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_CROSS_DOMAIN_LINEAGE'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_CROSS_TENANT_SEARCH_LEAKAGE'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_EVIDENCE_ACCESS_BYPASS'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_AUTHENTICATION_BYPASS'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_AUTHORIZATION_BYPASS'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_OPEN_REDIRECT'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_SECRET_EXPOSURE_IN_BROWSER'));
      assert.ok(SECURITY_HARD_INVARIANTS.includes('NO_SENSITIVE_STACK_TRACES_IN_PUBLIC_ERRORS'));
    });
  });
});
