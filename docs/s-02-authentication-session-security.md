# S-02: Authentication & Session Security Certification

- **Ticket ID**: `S-02`
- **Phase**: Production Security Hardening
- **Priority**: P0 — BLOCKING
- **Type**: Security / Authentication / Session / Backend / Contract
- **Depends on**: `S-01` 🔒
- **Blocks**: `S-03` $\rightarrow$ `S-12`, Production Release
- **Scope**: Authenticated User Plane only
- **Boundary**: Strict isolation between Guest (`GX`), Authenticated Workspace (`WX`), and Admin (`AX`) security planes.
- **Web Contract & Spec**: [`apps/web/src/features/security/contracts/s-02-authentication-session.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/security/contracts/s-02-authentication-session.contract.ts), [`apps/web/src/features/security/contracts/s-02-authentication-session.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/security/contracts/s-02-authentication-session.contract.spec.ts)
- **API Contract & Spec**: [`apps/api/src/modules/security/contracts/s-02-authentication-session.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/security/contracts/s-02-authentication-session.contract.ts), [`apps/api/src/modules/security/contracts/s-02-authentication-session.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/security/contracts/s-02-authentication-session.contract.spec.ts)
- **Certification Gate**: ✅ **PASSED**

---

## 1. Scope & Objective

```
                 S-01
        GLOBAL SECURITY BOUNDARY
                  │
                  ▼
                 S-02
       AUTHENTICATION + SESSIONS
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Login     OAuth    Refresh
        │         │         │
        └─────────┼─────────┘
                  ▼
            USER SESSION
                  │
                  ▼
            AUTHENTICATED
                  │
                  ▼
                  WX
```

### Four-Question Security Model

```
                  WHO ARE YOU?
                        ↓
            HOW WERE YOU AUTHENTICATED?
                        ↓
            IS YOUR SESSION STILL VALID?
                        ↓
            ARE YOU STILL ALLOWED TO USE IT?
```

> **Hard Invariant:** GX cannot create, inherit, upgrade, refresh, or impersonate a User Session. No frontend state, GX session, stale credential, or implicit browser context can manufacture or inherit authenticated Workspace access.

---

## 2. Authentication Lifecycle

```
                     ANONYMOUS
                         │
                         ▼
               AUTHENTICATION ATTEMPT (Password / OAuth)
                         │
                         ├── FAIL ──► DENIED (401 / 429)
                         │
                         ▼
               IDENTITY VERIFIED
                         │
                         ▼
              USER SESSION CREATED (DB Session + Access JWT + Refresh Token)
                         │
                         ▼
                       ACTIVE
                         │
                         ├── refresh ──► ROTATED (Old token invalidated, new issued)
                         │
                         ├── reuse ────► REUSE DETECTED (Family revoked, fail-closed)
                         │
                         ├── logout ───► REVOKED (Server-side DB revocation)
                         │
                         ├── expiry ───► EXPIRED (401)
                         │
                         └── security event ──► REVOKED (Global invalidation via tokenInvalidatedAt)
```

---

## 3. Access Token & Session Contract

### User Access Token Structure
- **Issuer (`iss`)**: `nebula-auth`
- **Audience (`aud`)**: `nebula-app`
- **Token Type (`typ`)**: `user-access`
- **Required Claims**: `sub` (User ID), `email`, `sessionId`, `iat`, `exp`
- **Lifetime**: 15 minutes
- **Admin Isolation**: Admin tokens use `iss: "nebula-admin-auth"`, `typ: "admin-access"`, `aal: "AAL3"` and cannot access user routes.

### Refresh Token Security & Rotation
- **Entropy**: Cryptographically secure 256-bit random hex strings.
- **Storage**: Only SHA-256 hashes (`refreshTokenHash`) stored in database; plaintext tokens never persisted.
- **Rotation**: Every successful refresh invalidates the used refresh token and issues a fresh one.
- **Replay Defense**: Presenting a previously rotated refresh token triggers `REFRESH_REUSE_DETECTED` and immediately revokes the session family.
- **Tenant Binding**: Refresh tokens are bound to user ID; cross-user exchanges fail closed.

---

## 4. Complete 24-Vector Attack Matrix & Verification

### Token Attacks (S02-01 to S02-06)
| ID | Attack Scenario | Expected Status | Result |
|:---|:---|:---:|:---:|
| `S02-01` | Expired JWT presented to API | `401 Unauthorized` | ✅ Certified |
| `S02-02` | Invalid signature / malformed token payload | `401 Unauthorized` | ✅ Certified |
| `S02-03` | Wrong issuer (`nebula-admin-auth` on user route) | `401 Unauthorized` | ✅ Certified |
| `S02-04` | Wrong audience (`admin-portal`) | `401 Unauthorized` | ✅ Certified |
| `S02-05` | Wrong token type (`admin-access` or `guest-token`) | `401 Unauthorized` | ✅ Certified |
| `S02-06` | Missing identity claim (`sub`, `email`, or `sessionId`) | `401 Unauthorized` | ✅ Certified |

### Refresh Attacks (S02-07 to S02-12)
| ID | Attack Scenario | Expected Status | Result |
|:---|:---|:---:|:---:|
| `S02-07` | Expired refresh token presented | `401 Unauthorized` | ✅ Certified |
| `S02-08` | Refresh attempt on revoked session | `401 Unauthorized` | ✅ Certified |
| `S02-09` | Replay of previously rotated refresh token | `401 Unauthorized` + `REFRESH_REUSE_DETECTED` | ✅ Certified |
| `S02-10` | Foreign-user refresh exchange (cross-user attack) | `401 Unauthorized` | ✅ Certified |
| `S02-11` | Malformed or empty refresh credentials | `401 Unauthorized` | ✅ Certified |
| `S02-12` | Refresh endpoint flooding | `429 Too Many Requests` | ✅ Certified |

### Session Attacks (S02-13 to S02-18)
| ID | Attack Scenario | Expected Status | Result |
|:---|:---|:---:|:---:|
| `S02-13` | Revoked session API request | `401 Unauthorized` | ✅ Certified |
| `S02-14` | Expired session API request | `401 Unauthorized` | ✅ Certified |
| `S02-15` | Deactivated or deleted user session | `401 Unauthorized` | ✅ Certified |
| `S02-16` | Session fixation attempt | Fresh session established (`200 OK`) | ✅ Certified |
| `S02-17` | Browser Back button resurrection after logout | `401 Unauthorized` | ✅ Certified |
| `S02-18` | Session access after global logout (`tokenInvalidatedAt`) | `401 Unauthorized` | ✅ Certified |

### GX Boundary Attacks (S02-19 to S02-24)
| ID | Attack Scenario | Expected Status | Result |
|:---|:---|:---:|:---:|
| `S02-19` | GX $\rightarrow$ WX implicit authentication | `401 Unauthorized` | ✅ Certified |
| `S02-20` | Guest ID $\rightarrow$ User session conversion | `401 Unauthorized` | ✅ Certified |
| `S02-21` | Guest credential presented to `/auth/refresh` | `401 Unauthorized` | ✅ Certified |
| `S02-22` | Authenticated browser opening `/guest` | GX remains GX (`200 OK`) | ✅ Certified |
| `S02-23` | Explicit authorized claim of discovery to WX | `200 OK` | ✅ Certified |
| `S02-24` | Replay of already converted/claimed guest session | `403 Forbidden` | ✅ Certified |

---

## 5. Canonical Security Event Model

All 12 security events are emitted with structured metadata and strict credential redaction:

1. `LOGIN_SUCCESS` — Successful password or direct authentication
2. `LOGIN_FAILURE` — Failed login attempt (generic error message)
3. `OAUTH_AUTHENTICATION` — Successful OAuth callback & identity linkage
4. `SESSION_CREATED` — Fresh server-side user session provisioned
5. `REFRESH_SUCCESS` — Successful refresh token rotation
6. `REFRESH_FAILURE` — Invalid, expired, or malformed refresh attempt
7. `REFRESH_REUSE_DETECTED` — Replay attack detected; token family revoked
8. `SESSION_REVOKED` — Individual session explicitly revoked by user
9. `LOGOUT` — User logout from current device
10. `GLOBAL_LOGOUT` — Global logout across all devices / password reset invalidation
11. `AUTH_RATE_LIMITED` — Abuse mitigation triggered for auth endpoints
12. `SESSION_INVALIDATED` — Session invalidated due to account state change

### Redaction Guard
The following fields are strictly redacted (`[REDACTED]`) in all audit logs:
- `password`, `confirmPassword`, `refreshToken`, `accessToken`, `rawRefreshToken`, `authorization`, `token`, `secret`, `clientSecret`, `refreshTokenHash`

---

## 6. Certification Gate

```
Authentication Integrity       ✅ PASSED
Access Token Integrity         ✅ PASSED
Refresh Rotation               ✅ PASSED
Refresh Replay Detection       ✅ PASSED
Session Lifecycle              ✅ PASSED
Logout / Revocation            ✅ PASSED
Account Lifecycle Integration  ✅ PASSED
OAuth Boundary                 ✅ PASSED
Browser Credential Security    ✅ PASSED
CSRF / Origin Posture          ✅ PASSED
Brute Force Protection         ✅ PASSED
Security Event Logging         ✅ PASSED
GX → WX Isolation              ✅ PASSED
Session Fixation Protection    ✅ PASSED
Cross-Session Isolation        ✅ PASSED
Direct API Verification        ✅ PASSED
Production Build               ✅ PASSED
```

> ### 🔒 S-02 CERTIFICATION GATE
>
> **"Nebula User authentication and sessions are independently established, cryptographically validated, lifecycle-controlled, revocable, replay-resistant, and isolated from Guest and Admin security planes. No frontend state, GX session, stale credential, or implicit browser context can manufacture or inherit authenticated Workspace access."**
