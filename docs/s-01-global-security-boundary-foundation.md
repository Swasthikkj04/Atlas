# S-01: Global Security Boundary Foundation

- **Ticket ID**: `S-01`
- **Phase**: Production Security Hardening
- **Priority**: P0 — BLOCKING
- **Type**: Security / Architecture / Backend / Contract
- **Status**: 🔒 CERTIFIED_GLOBAL_SECURITY_BOUNDARY
- **Blocks**: `S-02` → `S-XX`, Production Release
- **Web Contract & Spec**: [`apps/web/src/features/security/contracts/s-01-security-boundary.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/security/contracts/s-01-security-boundary.contract.ts), [`apps/web/src/features/security/contracts/s-01-security-boundary.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/security/contracts/s-01-security-boundary.contract.spec.ts)
- **API Contract & Spec**: [`apps/api/src/modules/security/contracts/s-01-security-boundary.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/security/contracts/s-01-security-boundary.contract.ts), [`apps/api/src/modules/security/contracts/s-01-security-boundary.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/security/contracts/s-01-security-boundary.contract.spec.ts)
- **Web Tests**: `1,488 passed, 0 failed`
- **API Tests**: `1,478 passed, 0 failed`
- **Certification Gate**: ✅ **PASSED**

---

## 1. Executive Objective

Establish and enforce a single canonical security-boundary model across Nebula:

> **Every Nebula resource belongs to an explicit security plane, and no request can cross that plane without an explicitly authorized transition.**

```
                         NEBULA PLATFORM
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
            GX                  WX               ADMIN
       Guest Plane          User Plane        Admin Plane
             │                  │                  │
         Ephemeral          Persistent         Privileged
          Session           Workspace           Control
             │                  │                  │
             └─────────X────────┴─────────X────────┘
                        NO IMPLICIT CROSSOVER
```

---

## 2. Frozen Security Principles

1. **`S-01-P01` — Authentication $\ne$ Authorization:**
   Possessing a valid authenticated session does not authorize access to every Nebula surface. Authorization must be evaluated independently.
2. **`S-01-P02` — Frontend Is Never the Security Boundary:**
   Routes (`/guest`, `/workspace`, `/admin`, `/settings`) are UX boundaries only. Security boundaries must exist at the backend/API/resource layer.
3. **`S-01-P03` — Security Plane Isolation:**
   Every request resolves to an explicit plane (`GX`, `WX`, `ADMIN`, `PUBLIC`). A credential valid in one plane must not automatically become valid in another.
4. **`S-01-P04` — Fail Closed:**
   When identity, authorization, ownership, session state, or security context cannot be established $\to$ **`DENY`**. Never fallback, guess, inherit, or continue.

---

## 3. Hard Security Invariants

- **`S01-I01`**: A valid credential does not imply universal authorization.
- **`S01-I02`**: Frontend navigation cannot grant authorization.
- **`S01-I03`**: GX cannot implicitly enter WX.
- **`S01-I04`**: WX cannot implicitly enter ADMIN.
- **`S01-I05`**: Resource identifiers never establish ownership.
- **`S01-I06`**: Every protected resource has an authorization decision.
- **`S01-I07`**: Authorization failure always fails closed.
- **`S01-I08`**: Security-plane crossover requires an explicit authorized contract.

---

## 4. Canonical Security Policy Matrix

| Caller Identity | Public Plane | GX Plane | WX Plane | Admin Plane |
|:---|:---:|:---:|:---:|:---:|
| **Anonymous** | ✅ ALLOWED | ✅ ALLOWED (ephemeral) | ❌ DENIED (`AUTH_REDIRECT`) | ❌ DENIED (403) |
| **Guest Session** | ⚠️ LIMITED | ✅ ALLOWED | ❌ DENIED (`EXPLICIT_CLAIM_ONLY`) | ❌ DENIED (403) |
| **Authenticated User** | ✅ ALLOWED | ✅ ALLOWED (remains Guest) | ✅ OWN_RESOURCES_ONLY | ❌ DENIED (403) |
| **Admin** | ✅ ALLOWED | ✅ ALLOWED (remains Guest) | ⚠️ EXPLICIT_RBAC_ONLY | ✅ ALLOWED_PRIVILEGED (AAL3) |

---

## 5. Resource Ownership Contract & Chain

Persistent user-owned resources are guarded by an unbroken ownership chain:

```
User -> Domain -> Snapshot -> (Findings | Brief | Evidence)
```

1. **Explicit Identity Binding:** The authenticated identity from `req.user.id` is passed directly to database queries.
2. **Zero Information Leakage:** Resources queried outside the caller's tenant scope return `404 Not Found` rather than `403 Forbidden`, preventing resource and tenant enumeration.
3. **Never Trust Input Parameters:** UUIDs, URL path params, request payloads, and storage tokens never establish ownership without cryptographic and relational database verification.

---

## 6. JWT Plane Separation

| Characteristic | Workspace User JWT | Admin JWT |
|:---|:---|:---|
| **Issuer (`iss`)** | `nebula-auth` | `nebula-admin-auth` |
| **Token Type (`typ`)** | `user-access` | `admin-access` |
| **Authentication Level (`aal`)** | `AAL1` / `AAL2` | `AAL3` (Hardware WebAuthn Passkey) |
| **Target Guard** | `JwtAuthGuard` | `AdminAuthorizationGuard` |
| **Cross-Plane Usability** | ❌ Cannot access Admin APIs | ❌ Cannot access normal user tenancy without explicit RBAC |

---

## 7. Direct Request & Bypass Defense

Requests originating from `curl`, Postman, browser DevTools, manual `fetch()`, forged UUIDs, expired JWTs, or wrong-plane tokens fail-closed at the backend middleware and guard layers independently of React routing.

---

## 8. Verification & Certification Gate

```
Security Contract              ✅
Security Context               ✅
Plane Matrix                   ✅
Ownership Boundary             ✅
JWT Plane Separation           ✅
Session Boundary               ✅
Direct API Bypass Tests        ✅
Cross-Plane Tests              ✅
Tenant Isolation Tests         ✅
Regression Suite               ✅
Production Build               ✅
```

> ### 🔒 S-01 CERTIFICATION GATE
>
> **"Every protected Nebula resource has an explicit, independently enforced security boundary, and no security plane can be entered through implicit authentication inheritance or frontend behavior."**
