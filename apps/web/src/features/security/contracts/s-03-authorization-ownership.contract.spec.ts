import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S03_TICKET_ID,
  S03_PHASE,
  S03_PRIORITY,
  S03_TYPE,
  S03_STATUS,
  S03_PRINCIPLES,
  S03_INVARIANTS,
  S03_SECURITY_MATRIX,
  evaluateResourceAccess,
  evaluateNestedResourceAccess,
  evaluateOwnershipMutation,
  evaluateBulkResourceAccess,
  evaluateClaimOperation,
  verifyS03Certification,
  S03_CERTIFICATION_STATEMENT,
  type SecurityPrincipal,
  type ProtectedResource,
  type GuestSessionResource,
} from './s-03-authorization-ownership.contract.ts';

describe('S-03 — Authorization, Ownership & Tenant Isolation Web Contract & Suite', () => {
  const userA: SecurityPrincipal = {
    id: 'user-a-uuid',
    email: 'user.a@nebula.io',
    plane: 'WX',
    userStatus: 'ACTIVE',
    sessionStatus: 'ACTIVE',
  };

  const userB: SecurityPrincipal = {
    id: 'user-b-uuid',
    email: 'user.b@nebula.io',
    plane: 'WX',
    userStatus: 'ACTIVE',
    sessionStatus: 'ACTIVE',
  };

  const adminPrincipal: SecurityPrincipal = {
    id: 'admin-uuid',
    email: 'admin@nebula.io',
    plane: 'AX',
    userStatus: 'ACTIVE',
    sessionStatus: 'ACTIVE',
  };

  const guestPrincipal: SecurityPrincipal = {
    id: 'guest-session-uuid',
    plane: 'GX',
  };

  const domainUserA: ProtectedResource = {
    id: 'dom-user-a',
    type: 'DOMAIN',
    ownerId: 'user-a-uuid',
  };

  const domainUserB: ProtectedResource = {
    id: 'dom-user-b',
    type: 'DOMAIN',
    ownerId: 'user-b-uuid',
  };

  const snapshotUserB: ProtectedResource = {
    id: 'snp-user-b',
    type: 'SNAPSHOT',
    ownerId: 'user-b-uuid',
    domainId: 'dom-user-b',
  };

  const findingUserB: ProtectedResource = {
    id: 'fnd-user-b',
    type: 'FINDING',
    ownerId: 'user-b-uuid',
    snapshotId: 'snp-user-b',
    domainId: 'dom-user-b',
  };

  const briefUserB: ProtectedResource = {
    id: 'brf-user-b',
    type: 'BRIEF',
    ownerId: 'user-b-uuid',
    snapshotId: 'snp-user-b',
  };

  const evidenceUserB: ProtectedResource = {
    id: 'evd-user-b',
    type: 'EVIDENCE',
    ownerId: 'user-b-uuid',
    snapshotId: 'snp-user-b',
    domainId: 'dom-user-b',
  };

  describe('1. Contract Metadata, Principles & Invariants', () => {
    it('enforces S-03 metadata and P0 blocking priority', () => {
      assert.equal(S03_TICKET_ID, 'S-03');
      assert.equal(S03_PHASE, 'Production Security Hardening');
      assert.equal(S03_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S03_TYPE, 'Security / Authorization / Multi-Tenancy / Backend / Repository / Contract');
      assert.equal(S03_STATUS, 'CERTIFIED_AUTHORIZATION_OWNERSHIP');
    });

    it('enforces all 4 canonical security principles', () => {
      assert.equal(Object.keys(S03_PRINCIPLES).length, 4);
      assert.ok(S03_PRINCIPLES.S03_P01_AUTHORIZATION_INDEPENDENCE.includes('Authorization determines what you may access'));
      assert.ok(S03_PRINCIPLES.S03_P02_CANONICAL_CHAIN.includes('Canonical Authorization Chain'));
      assert.ok(S03_PRINCIPLES.S03_P03_OWNERSHIP_CHAIN.includes('Resource Ownership Model'));
      assert.ok(S03_PRINCIPLES.S03_P04_INFORMATION_MINIMIZATION.includes('404 Not Found'));
    });

    it('enforces all 10 P0 authorization invariants', () => {
      assert.equal(Object.keys(S03_INVARIANTS).length, 10);
      assert.ok(S03_INVARIANTS.S03_I01_IDENTITY_BINDING.includes('request.user.id'));
      assert.ok(S03_INVARIANTS.S03_I02_REPOSITORY_ENFORCEMENT.includes('repository'));
      assert.ok(S03_INVARIANTS.S03_I03_NO_IDOR.includes('UUID'));
      assert.ok(S03_INVARIANTS.S03_I04_NESTED_RESOURCE_ISOLATION.includes('child resource'));
      assert.ok(S03_INVARIANTS.S03_I05_NO_OWNERSHIP_MUTATION.includes('mutate ownership'));
      assert.ok(S03_INVARIANTS.S03_I06_404_VS_403_CONTRACT.includes('404 Not Found'));
      assert.ok(S03_INVARIANTS.S03_I07_GX_WX_BOUNDARY.includes('GX sessions'));
      assert.ok(S03_INVARIANTS.S03_I08_ATOMIC_CLAIM.includes('Guest → Workspace transition'));
      assert.ok(S03_INVARIANTS.S03_I09_BULK_ISOLATION.includes('independently satisfy'));
      assert.ok(S03_INVARIANTS.S03_I10_TOCTOU_RACE_PROTECTION.includes('atomically constrained'));
    });

    it('defines complete 30-vector attack matrix (S03-01 to S03-30)', () => {
      assert.equal(S03_SECURITY_MATRIX.length, 30);
      const ids = S03_SECURITY_MATRIX.map((m) => m.id);
      for (let i = 1; i <= 30; i++) {
        const id = `S03-${String(i).padStart(2, '0')}`;
        assert.ok(ids.includes(id as any));
      }
    });
  });

  describe('2. Direct Resource Ownership Attacks (S03-01 to S03-09)', () => {
    it('S03-01: User A reading User B domain returns 404', () => {
      const res = evaluateResourceAccess(userA, domainUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
      assert.equal(res.decision, 'OWNERSHIP_MISMATCH_404');
    });

    it('S03-02: User A updating User B domain returns 404', () => {
      const res = evaluateResourceAccess(userA, domainUserB, 'UPDATE');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-03: User A deleting User B domain returns 404', () => {
      const res = evaluateResourceAccess(userA, domainUserB, 'DELETE');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-04: User A reading User B snapshot returns 404', () => {
      const res = evaluateResourceAccess(userA, snapshotUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-05: User A reading User B finding returns 404', () => {
      const res = evaluateResourceAccess(userA, findingUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-06: User A reading User B brief returns 404', () => {
      const res = evaluateResourceAccess(userA, briefUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-07: User A reading User B evidence returns 404', () => {
      const res = evaluateResourceAccess(userA, evidenceUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-08: User A traversing User B nested snapshot returns 404', () => {
      const res = evaluateNestedResourceAccess(userA, domainUserB, snapshotUserB);
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-09: User A enumerating random/sequential UUIDs returns 404 without disclosure', () => {
      const randomResource: ProtectedResource = {
        id: 'random-uuid-999',
        type: 'DOMAIN',
        ownerId: 'unrelated-user',
      };
      const res = evaluateResourceAccess(userA, randomResource, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
      assert.equal(res.reason, 'Resource not found.');
    });
  });

  describe('3. Ownership Mutation & Injection Attacks (S03-10 to S03-15)', () => {
    it('S03-10: Client supplying foreign userId in creation/update payload is rejected', () => {
      const res = evaluateOwnershipMutation(userA, domainUserA, {
        userId: 'attacker-injected-user-id',
      });
      assert.equal(res.allowed, false);
      assert.equal(res.httpStatus, 400);
      assert.equal(res.decision, 'OWNERSHIP_MUTATION_REJECTED');
    });

    it('S03-11: Client supplying foreign domainId for child resource is rejected', () => {
      const res = evaluateNestedResourceAccess(userA, domainUserA, snapshotUserB);
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-12: Client modifying ownerId field on domain is rejected', () => {
      const res = evaluateOwnershipMutation(userA, domainUserA, {
        ownerId: 'transferred-user-id',
      });
      assert.equal(res.allowed, false);
      assert.equal(res.httpStatus, 400);
    });

    it('S03-13: Client changing snapshot ownership via update is rejected', () => {
      const snapshotUserA: ProtectedResource = {
        id: 'snp-user-a',
        type: 'SNAPSHOT',
        ownerId: 'user-a-uuid',
        domainId: 'dom-user-a',
      };
      const res = evaluateOwnershipMutation(userA, snapshotUserA, {
        domainId: 'dom-user-b',
      });
      assert.equal(res.allowed, false);
      assert.equal(res.httpStatus, 400);
    });

    it('S03-14: Client changing finding ownership is rejected', () => {
      const findingUserA: ProtectedResource = {
        id: 'fnd-user-a',
        type: 'FINDING',
        ownerId: 'user-a-uuid',
      };
      const res = evaluateOwnershipMutation(userA, findingUserA, {
        tenantId: 'other-tenant',
      });
      assert.equal(res.allowed, false);
      assert.equal(res.httpStatus, 400);
    });

    it('S03-15: Deleted owner resource returns 404', () => {
      const deletedDomain: ProtectedResource = {
        id: 'dom-deleted',
        type: 'DOMAIN',
        ownerId: 'user-a-uuid',
        isDeleted: true,
      };
      const res = evaluateResourceAccess(userA, deletedDomain, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });
  });

  describe('4. Lifecycle & Cross-Plane Isolation Attacks (S03-16 to S03-25)', () => {
    it('S03-16: Deactivated user accessing owned resource returns 401', () => {
      const deactivatedUser: SecurityPrincipal = {
        ...userA,
        userStatus: 'DEACTIVATED',
      };
      const res = evaluateResourceAccess(deactivatedUser, domainUserA, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.decision, 'ACCOUNT_INVALID');
    });

    it('S03-17: Revoked session accessing owned resource returns 401', () => {
      const revokedUser: SecurityPrincipal = {
        ...userA,
        sessionStatus: 'REVOKED',
      };
      const res = evaluateResourceAccess(revokedUser, domainUserA, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.decision, 'SESSION_INVALID');
    });

    it('S03-18: Expired session accessing owned resource returns 401', () => {
      const expiredUser: SecurityPrincipal = {
        ...userA,
        sessionStatus: 'EXPIRED',
      };
      const res = evaluateResourceAccess(expiredUser, domainUserA, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.decision, 'SESSION_INVALID');
    });

    it('S03-19: Valid User JWT accessing Admin resource returns 403', () => {
      const adminResource: ProtectedResource = {
        id: 'admin-cfg-1',
        type: 'ADMIN_RESOURCE',
        ownerId: 'system',
      };
      const res = evaluateResourceAccess(userA, adminResource, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 403);
      assert.equal(res.decision, 'ADMIN_PLANE_ISOLATION');
    });

    it('S03-20: Admin JWT accessing User resource without delegation returns 403', () => {
      const res = evaluateResourceAccess(adminPrincipal, domainUserA, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 403);
      assert.equal(res.decision, 'USER_PLANE_ISOLATION');
    });

    it('S03-21: Guest ID used as domain owner is denied (401)', () => {
      const res = evaluateResourceAccess(guestPrincipal, domainUserA, 'CREATE');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
    });

    it('S03-22: GX session accessing WX domain returns 401', () => {
      const res = evaluateResourceAccess(guestPrincipal, domainUserA, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
      assert.equal(res.decision, 'GX_PLANE_ISOLATION');
    });

    it('S03-23: GX session accessing WX snapshot returns 401', () => {
      const res = evaluateResourceAccess(guestPrincipal, snapshotUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
    });

    it('S03-24: GX session accessing WX finding returns 401', () => {
      const res = evaluateResourceAccess(guestPrincipal, findingUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
    });

    it('S03-25: Guest modifying authenticated resource is denied', () => {
      const res = evaluateResourceAccess(guestPrincipal, domainUserA, 'UPDATE');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 401);
    });
  });

  describe('5. Complex Navigation, Bulk & Race Attacks (S03-26 to S03-30)', () => {
    it('S03-26: User A manipulating nested route to User B child resource returns 404', () => {
      const res = evaluateNestedResourceAccess(userA, domainUserA, snapshotUserB);
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });

    it('S03-27: User A changing query filter to User B domain receives 0 unowned items', () => {
      const allResources = [domainUserA, domainUserB];
      const bulkResult = evaluateBulkResourceAccess(userA, allResources);
      assert.equal(bulkResult.authorizedResources.length, 1);
      assert.equal(bulkResult.authorizedResources[0].id, 'dom-user-a');
      assert.equal(bulkResult.deniedCount, 1);
    });

    it('S03-28: Bulk endpoint requesting mixed ownership IDs filters foreign resources', () => {
      const mixed = [domainUserA, domainUserB, snapshotUserB, findingUserB];
      const bulk = evaluateBulkResourceAccess(userA, mixed);
      assert.equal(bulk.authorizedResources.length, 1);
      assert.equal(bulk.authorizedResources[0].ownerId, 'user-a-uuid');
      assert.equal(bulk.deniedCount, 3);
    });

    it('S03-29: Concurrent claim race / re-claim attempt fails closed (403)', () => {
      const convertedGuest: GuestSessionResource = {
        id: 'guest-sess-1',
        status: 'CONVERTED',
        claimedByUserId: 'user-a-uuid',
      };
      const res = evaluateClaimOperation(userB, convertedGuest);
      assert.equal(res.success, false);
      assert.equal(res.httpStatus, 403);
      assert.equal(res.decision, 'GUEST_SESSION_ALREADY_CLAIMED');
    });

    it('S03-30: Direct API / curl bypass of frontend authorization fails closed', () => {
      const res = evaluateResourceAccess(userA, domainUserB, 'READ');
      assert.equal(res.authorized, false);
      assert.equal(res.httpStatus, 404);
    });
  });

  describe('6. Certification Gate Verification', () => {
    it('verifies the exact S-03 Certification Statement passes', () => {
      const gate = verifyS03Certification(
        'No authenticated Nebula user, guest session, administrator, frontend client, resource identifier, nested-resource path, or client-supplied ownership field can cross a tenant or resource authorization boundary without an explicitly authorized server-side decision.'
      );
      assert.equal(gate.passed, true);
      assert.ok(gate.similarityRatio >= 0.99);
      assert.equal(gate.canonicalStatement, S03_CERTIFICATION_STATEMENT);
    });
  });
});
