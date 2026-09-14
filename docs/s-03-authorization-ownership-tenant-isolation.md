# S-03: Authorization, Ownership & Tenant Isolation Certification

- **Ticket ID**: `S-03`
- **Phase**: Production Security Hardening
- **Priority**: P0 — BLOCKING
- **Type**: Security / Authorization / Multi-Tenancy / Backend / Repository / Contract
- **Depends on**: `S-01` 🔒, `S-02` 🔒
- **Blocks**: `S-04` $\rightarrow$ `S-12`, Production Release
- **Scope**: Authenticated Workspace (`WX`), Multi-Tenancy, Resource Ownership, Repository Scoping, IDOR Defense
- **Boundary**: Strict isolation between individual tenants, resource chains, guest sessions, and administration planes.
- **Web Contract & Spec**: [`apps/web/src/features/security/contracts/s-03-authorization-ownership.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/security/contracts/s-03-authorization-ownership.contract.ts), [`apps/web/src/features/security/contracts/s-03-authorization-ownership.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/security/contracts/s-03-authorization-ownership.contract.spec.ts)
- **API Contract & Spec**: [`apps/api/src/modules/security/contracts/s-03-authorization-ownership.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/security/contracts/s-03-authorization-ownership.contract.ts), [`apps/api/src/modules/security/contracts/s-03-authorization-ownership.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/security/contracts/s-03-authorization-ownership.contract.spec.ts)
- **Certification Gate**: ✅ **PASSED**

---

## 1. Security Objective & Core Architecture

> **Certification Gate**:
> *"A valid authenticated identity may access only resources explicitly authorized for that identity. No resource identifier, URL, frontend state, JWT possession, or nested-resource relationship may bypass ownership or tenant boundaries."*

### Frozen Security Principles

1. **Authorization Independence**: Authentication proves *who you are*. Authorization determines *what you may access*. Ownership determines *whose data you may access*. Authorization is an independent security layer, never an implicit side-effect of successful authentication.
2. **Canonical Authorization Chain**: Every single request traverses the multi-tier authorization hierarchy before granting data access:
   ```
   REQUEST
      │
      ▼
   AUTHENTICATION
      │
      ├── Valid Identity Context? ──NO──► 401 Unauthorized
      │
      ▼
   AUTHORIZATION
      │
      ├── Allowed for this Role / Plane? ──NO──► 403 Forbidden
      │
      ▼
   RESOURCE OWNERSHIP
      │
      ├── Principal owns Parent / Resource? ──NO──► 404 Not Found (Information Minimization)
      │
      ▼
   TENANT BOUNDARY
      │
      ├── Scoped Data Boundary Satisfied? ──NO──► 404 Not Found
      │
      ▼
   ACTION AUTHORIZATION
      │
      ├── Operation Permitted (Read / Write)? ──NO──► 403 Forbidden
      │
      ▼
   ALLOW (200 / 201)
   ```
3. **Hierarchical Resource Ownership Model**:
   ```
   USER (userId)
     │
     └──► DOMAIN (userId, domainId)
            │
            └──► SNAPSHOT (domainId, snapshotId)
                   │
                   ├──► FINDING (snapshotId, domainId)
                   ├──► BRIEF (snapshotId, domainId)
                   └──► EVIDENCE (snapshotId, domainId)
   ```
   Knowing or guessing a valid UUID (Domain ID, Snapshot ID, Finding ID, Evidence ID) conveys zero authorization. Accessing a child resource requires verified ownership of the entire ancestor chain.
4. **Information Minimization (404 Anti-Enumeration Contract)**: If a requested resource exists in the database but belongs to a different tenant, the API responds with `404 Not Found` (never `403 Forbidden`). This eliminates tenancy discovery and identifier oracle enumeration attacks.

---

## 2. P0 Authorization Invariants

| ID | Invariant | Enforcement Mechanism |
| :--- | :--- | :--- |
| `S03-I01` | **Identity Binding** | Resource authorization is strictly derived from verified principal context (`req.user.id`). Client-supplied `body.userId`, `query.userId`, or `params.userId` are ignored or rejected. |
| `S03-I02` | **Repository-Level Scoping** | Database queries enforce ownership constraints in the `WHERE` clause (`where: { id, domain: { userId } }`), ensuring controllers are not the sole ownership barrier. |
| `S03-I03` | **Anti-IDOR Defense** | Cross-tenant lookups by UUID return `404 Not Found`. UUID knowledge conveys no authorization. |
| `S03-I04` | **Nested Resource Isolation** | Traversing parent-child relationships (e.g. `/snapshots/:id/brief`) validates the caller owns both the parent snapshot and its parent domain. |
| `S03-I05` | **Immutable Ownership Fields** | Client mutation of `userId`, `ownerId`, `domainId`, `workspaceId`, `tenantId` via POST/PUT/PATCH is rejected with `400 Bad Request`. |
| `S03-I06` | **404 vs 403 Distinction** | Unowned existing resources return `404 Not Found`. Authentication plane or administrative boundary violations return `401 / 403`. |
| `S03-I07` | **GX $\rightarrow$ WX Plane Isolation** | Guest sessions (`GX`) cannot access Workspace (`WX`) resources. Visiting `/guest` in an authenticated session does not cross tenant boundaries. |
| `S03-I08` | **Atomic Claim Transition** | Guest session claim is a single-use atomic server transaction. Replay attempts and cross-claiming return `403 Forbidden`. |
| `S03-I09` | **Bulk & Collection Isolation** | Batch or multi-resource operations independently evaluate every record. Foreign items are filtered out or denied without partial tenant leakage. |
| `S03-I10` | **TOCTOU Protection** | Mutations are atomically constrained by ownership at execution time (`UPDATE WHERE id = :id AND userId = :userId`). |

---

## 3. Comprehensive 30-Vector Attack Matrix (S03-01 to S03-30)

| Vector ID | Attack Scenario | Evaluator / System Behavior | Expected Status | Decision Result |
| :--- | :--- | :--- | :---: | :--- |
| `S03-01` | User A reads User B domain | Repository scopes query to User A; resource not found | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-02` | User A updates User B domain | Atomic update fails scoped ownership check | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-03` | User A deletes User B domain | Scoped delete returns 404 without altering record | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-04` | User A reads User B snapshot | Nested lookup verifies domain ownership; fails | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-05` | User A reads User B finding | Finding query filters `snapshot.domain.userId` | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-06` | User A reads User B brief | Brief query filters `snapshot.domain.userId` | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-07` | User A reads User B evidence | Evidence retrieval enforces user lineage boundary | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-08` | User A traverses User B nested snapshot | Route parameter traversal blocked at parent scope | `404` | `OWNERSHIP_MISMATCH_404` |
| `S03-09` | User A enumerates sequential/random UUIDs | Non-owned UUID queries uniformly return 404 | `404` | Zero Existence Disclosure |
| `S03-10` | Client supplies foreign userId in payload | DTO ignores client userId; binds server `req.user.id` | `400 / 200` | Client userId Ignored/Rejected |
| `S03-11` | Client supplies foreign domainId | Child creation validates domain ownership; fails | `404` | Target Domain Unowned |
| `S03-12` | Client modifies ownership field via PATCH | Forbidden key rejection validator blocks request | `400` | `OWNERSHIP_MUTATION_REJECTED` |
| `S03-13` | Client changes snapshot domainId | Snapshot mutation payload rejected | `400` | `OWNERSHIP_MUTATION_REJECTED` |
| `S03-14` | Client changes finding tenantId | Finding mutation payload rejected | `400` | `OWNERSHIP_MUTATION_REJECTED` |
| `S03-15` | Deleted owner resource requested | Deleted status evaluated; lookup returns 404 | `404` | `RESOURCE_NOT_FOUND` |
| `S03-16` | Deactivated user accesses owned resource | Auth plane intercepts inactive status | `401` | `ACCOUNT_INVALID` |
| `S03-17` | Revoked session accesses owned resource | Session validation intercepts revoked token | `401` | `SESSION_INVALID` |
| `S03-18` | Expired session accesses owned resource | Session validation intercepts expired token | `401` | `SESSION_INVALID` |
| `S03-19` | Valid User JWT accesses Admin resource | Admin guard enforces `AX` plane requirement | `403` | `ADMIN_PLANE_ISOLATION` |
| `S03-20` | Admin JWT accesses User resource without context | Direct un-delegated user workspace access denied | `403` | `USER_PLANE_ISOLATION` |
| `S03-21` | Guest ID used as domain owner | Unauthenticated/guest identity cannot own domain | `401` | Authentication Required |
| `S03-22` | GX session accesses WX domain | Guest principal plane check blocks access | `401` | `GX_PLANE_ISOLATION` |
| `S03-23` | GX session accesses WX snapshot | Guest principal plane check blocks access | `401` | `GX_PLANE_ISOLATION` |
| `S03-24` | GX session accesses WX finding | Guest principal plane check blocks access | `401` | `GX_PLANE_ISOLATION` |
| `S03-25` | Guest modifies authenticated resource ID | Mutation attempt by guest rejected | `401` | `GX_PLANE_ISOLATION` |
| `S03-26` | User A manipulates nested route to User B child | Parent-child relationship validation fails | `404` | `NESTED_PARENT_CHILD_MISMATCH` |
| `S03-27` | User A changes query filter to User B domain | Query filter automatically constrained to caller | `200` | Returns 0 unowned items |
| `S03-28` | Bulk endpoint requests mixed ownership IDs | Evaluator filters out all foreign resources | `200` | Foreign Resources Excluded |
| `S03-29` | Concurrent claim race / re-claim attempt | Single-use atomic transaction rejects race | `403` | `GUEST_SESSION_ALREADY_CLAIMED` |
| `S03-30` | Direct API / curl bypass of frontend authorization | Server-side repository guards deny request | `404` | Server-Side Enforcement Active |

---

## 4. Repository-Level Implementation Reference

All database queries across Atlas modules enforce tenant and ownership boundaries natively in Prisma queries:

1. **Domains**:
   ```typescript
   // DomainsRepository.findByIdForUser
   prisma.domain.findFirst({
     where: { id: domainId, userId }
   });
   ```
2. **Snapshots**:
   ```typescript
   // InfrastructureSnapshotRepository.findByIdForUser
   prisma.infrastructureSnapshot.findFirst({
     where: { id: snapshotId, domain: { userId } }
   });
   ```
3. **Findings**:
   ```typescript
   // InfrastructureFindingRepository.findUserFindingById
   prisma.infrastructureFinding.findFirst({
     where: {
       id: findingId,
       snapshot: { domain: { userId } }
     }
   });
   ```
4. **Briefs & Timeline**:
   ```typescript
   // InfrastructureBriefRepository.findBySnapshotForUser
   prisma.infrastructureBrief.findFirst({
     where: {
       snapshotId,
       snapshot: { domain: { userId } }
     }
   });
   ```

---

## 5. Certification Gate Verification

The S-03 Certification Statement is verified across both Backend and Frontend test suites:

> *"No authenticated Nebula user, guest session, administrator, frontend client, resource identifier, nested-resource path, or client-supplied ownership field can cross a tenant or resource authorization boundary without an explicitly authorized server-side decision."*

- **Web Spec**: 100% Passed (`node:test`)
- **API Spec**: 100% Passed (`jest`)
- **Regression Impact**: 0 regressions across all suites
- **Result**: ✅ **CERTIFIED**
