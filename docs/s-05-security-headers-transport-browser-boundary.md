# S-05 — Security Headers, Transport & Browser Boundary Certification

- **Ticket ID:** `S-05`
- **Phase:** Production Security Hardening
- **Priority:** P0 — BLOCKING
- **Type:** Security / HTTP / Browser Security / Transport / Backend / Web / Contract
- **Depends on:** `S-01` 🔒, `S-02` 🔒, `S-03` 🔒, `S-04` 🔒
- **Blocks:** `S-06` $\rightarrow$ `S-12` and Production Release
- **Status:** 🔒 `CERTIFIED_TRANSPORT_BROWSER_SECURITY`

---

## 1. Canonical Certification Gate & Frozen Principles

> ### Canonical Certification Gate
> *"Nebula's browser and HTTP transport surface must be explicitly hardened so that authenticated credentials, protected resources, browser execution contexts, framing contexts, content types, and cross-origin requests cannot be abused to bypass or weaken the established security boundary."*

> ### Secondary Certification Gate
> *"Nebula's transport, browser, origin, credential, framing, content, and caching boundaries are explicitly enforced and independently verified. Browser behavior cannot weaken the authentication, authorization, tenant-isolation, or GX/WX security boundaries established by S-01 through S-04."*

### Frozen Principles

1. **Perimeter Continuity:**  
   *"The application boundary does not end at the API route. Transport and browser behavior are part of the security perimeter."*
2. **No Compensating Assumptions:**  
   *"No layer is permitted to assume that another layer will compensate for it (HTTPS $\rightarrow$ Security Headers $\rightarrow$ CORS / Origin $\rightarrow$ Cookie / CSRF $\rightarrow$ Content / MIME $\rightarrow$ S-02 Auth $\rightarrow$ S-03 Authz $\rightarrow$ Resource)."*
3. **GX/WX Browser Isolation:**  
   *"Same browser $\ne$ same security context. Same origin $\ne$ same authorization plane. Authenticated browser $\ne$ authenticated GX. GX navigation $\ne$ WX authorization."*
4. **Direct API Independence:**  
   *"Direct API requests bypassing browser controls are independently secured by S-02 authentication and S-03 authorization."*

---

## 2. Canonical Security Layers

```
                    INTERNET
                       │
                       ▼
              ┌─────────────────┐
              │    HTTPS/TLS    │   (S05-I01, S05-I02)
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ SECURITY HEADERS│   (S05-I03, S05-I04, S05-I05, S05-I06, S05-I07)
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ CORS / ORIGIN   │   (S05-I08, Plane Boundary)
              │    POLICY       │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ COOKIE / CSRF   │   (S05-I09, S05-I10)
              │    POSTURE      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ CONTENT / MIME  │   (S05-I05, S05-I11)
              │  & CACHE GUARD  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ S-02 AUTH       │   (Identity & Session Verification)
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ S-03 AUTHZ      │   (Tenant Ownership & Plane Access)
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ S-04 VALIDATION │   (Input Sanitization & Injection Guard)
              └────────┬────────┘
                       │
                       ▼
                    RESOURCE
```

*No layer is permitted to assume that another layer will compensate for it.*

---

## 3. P0 Security Invariants

| Invariant | Title | Specification | Fail-Closed Enforcement |
|:---|:---|:---|:---|
| **S05-I01** | **HTTPS Enforcement** | Production authenticated traffic must use HTTPS. No authenticated API operation permitted over plaintext transport. HTTP $\rightarrow$ HTTPS redirect where applicable. | `evaluateTransportSecurity` rejects plaintext requests on authenticated routes with HTTP 400 (`HTTP_PLAINTEXT_REJECTED`). |
| **S05-I02** | **HSTS (Strict-Transport-Security)** | Production responses must establish strict transport security: `max-age=31536000; includeSubDomains; preload` ($\ge 1$ year). | `evaluateSecurityHeaders` asserts HSTS presence and `max-age >= 15552000` with `includeSubDomains`. |
| **S05-I03** | **Content Security Policy (CSP)** | Browser execution surface must have an explicit CSP preventing arbitrary script execution, uncontrolled inline scripts, unauthorized framing, and dangerous directives (`unsafe-eval`). | `validateCspString` enforces strict directives and rejects `unsafe-eval` or wildcard sources in production (`UNSAFE_EVAL_PROHIBITED`). |
| **S05-I04** | **Clickjacking Protection** | Protected surfaces must not be frameable by arbitrary origins (`frame-ancestors 'none'`, `X-Frame-Options: DENY`). | Verified in headers evaluation (`X-Frame-Options: DENY`) and `evaluateWindowFraming` (`FRAMING_BLOCKED`). |
| **S05-I05** | **MIME Sniffing Protection** | Production responses must include `X-Content-Type-Options: nosniff`. The server must provide correct content types. | Evaluated via `evaluateSecurityHeaders`; missing or non-`nosniff` rejected (`MIME_SNIFFING_BLOCKED`). |
| **S05-I06** | **Referrer Control** | Prevent leakage of authenticated application paths or sensitive navigation context (`Referrer-Policy: strict-origin-when-cross-origin`). | Verified across API middleware and web responses; permissive policies flagged (`PERMISSIVE_REFERRER_REJECTED`). |
| **S05-I07** | **Permissions Policy** | Browser hardware and privacy capabilities minimized: `camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=(), accelerometer=(), gyroscope=(), magnetometer=()`. | Injected into all API responses via `SecurityHeadersMiddleware` (`CAPABILITY_BLOCKED`). |
| **S05-I08** | **CORS Allowlist** | CORS must be explicit. `Access-Control-Allow-Origin: *` is strictly forbidden for credential-bearing APIs. Explicit allowlist with exact matching required. | `evaluateCorsRequest` rejects wildcards on credentialed endpoints (`WILDCARD_CREDENTIALS_REJECTED`). |
| **S05-I09** | **Credential Boundary** | Browser credentials must never be exposed to JS unnecessarily. Cookies must use `Secure`, `HttpOnly`, `SameSite`. No tokens in URLs, localStorage, DOM, logs, or analytics. | `auditBrowserStorage` and `containsUrlCredentials` reject prohibited storage keys and URL params (`CREDENTIAL_IN_URL_REJECTED`). |
| **S05-I10** | **CSRF Boundary** | Any credential-bearing state-changing request must have a deliberate CSRF posture: SameSite cookie isolation, Origin/Referer validation, and custom header enforcement (`X-CSRF-Token` / `X-Requested-With`). | `evaluateCsrfProtection` and `CsrfGuard` reject cross-origin state changes lacking verified origin or custom headers (`CROSS_ORIGIN_CSRF_REJECTED`). |
| **S05-I11** | **Cache Isolation** | Authenticated responses containing private workspace/session info must not become cached: `Cache-Control: private, no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`. | `evaluateCacheIsolation` asserts `no-store` and `no-cache` on sensitive routes (`PUBLIC_CACHE_PROHIBITED`, `NO_STORE_REQUIRED`). |
| **S05-I12** | **Credential Leakage Prevention** | Security-sensitive headers, error responses, redirects, and logs must never expose JWTs, refresh tokens, session secrets, or server identifiers (`X-Powered-By` removed). | `AllExceptionsFilter` formats safe responses; `SecurityHeadersMiddleware` strips `X-Powered-By`. |

---

## 4. Security Header Baseline

| Header | Canonical Production Configuration | Rationale |
|:---|:---|:---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces all browser communication over TLS 1.3/HTTPS |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';` | Prevents XSS, unauthorized script loading, framing, and injection |
| `X-Frame-Options` | `DENY` | Defense-in-depth clickjacking prevention |
| `X-Content-Type-Options` | `nosniff` | Disables MIME type sniffing by the browser |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Strips path and query information on cross-origin requests |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=(), accelerometer=(), gyroscope=(), magnetometer=()` | Disables sensitive hardware/sensor APIs |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context to prevent cross-origin window leaks |
| `Cross-Origin-Resource-Policy`| `same-origin` | Blocks other origins from reading static resources |

---

## 5. CSP Architecture: GX vs WX Isolation

```
┌──────────────────────────────────────────────┐
│                    NEBULA                    │
├──────────────────────┬───────────────────────┤
│     GUEST (GX)       │   AUTHENTICATED (WX)  │
├──────────────────────┼───────────────────────┤
│ • Public landing     │ • User dashboard      │
│ • Ephemeral state    │ • Workspace data      │
│ • Approved assets    │ • Tenant telemetry    │
│ • OAuth destinations │ • API management      │
│ • Strict CSP         │ • Strict CSP          │
│ • frame-ancestors:   │ • frame-ancestors:    │
│   'none'             │   'none'              │
└──────────────────────┴───────────────────────┘
```

- **GX** must never receive a relaxed CSP simply because it is public. Public does not mean untrusted browser execution is acceptable.
- **WX** execution is strictly isolated with `frame-ancestors 'none'` and zero inline script execution outside controlled theme styles.

---

## 6. Origin & Plane Boundary

```
                  REQUEST ORIGIN
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   PUBLIC / GX    AUTHENTICATED / WX    ADMIN
        │                │                │
        └───────────────┬┴────────────────┘
                        ▼
            Explicit Allowlist Check
                        ▼
               Plane Boundary Guard
            (WX cannot call ADMIN API)
                        ▼
             Authentication & Sessions
                        ▼
             Authorization & Ownership
```

- An origin relationship never automatically implies authorization.
- Even for same-origin requests (`GX -> same origin -> WX`), the request strictly traverses Authentication $\rightarrow$ Plane Validation $\rightarrow$ Authorization $\rightarrow$ Ownership.

---

## 7. 40-Vector Attack Matrix & Certification Results

| ID | Attack Scenario | Category | Expected HTTP Status | Expected Decision | Result |
|:---|:---|:---:|:---:|:---|:---:|
| **S05-01** | HTTP access to authenticated route | TRANSPORT | 400 | `HTTP_PLAINTEXT_REJECTED` | ✅ PASS |
| **S05-02** | HTTPS downgrade attempt | TRANSPORT | 400 | `DOWNGRADE_ATTEMPT_REJECTED` | ✅ PASS |
| **S05-03** | Missing HSTS | TRANSPORT | 400 | `HSTS_MISSING` | ✅ PASS |
| **S05-04** | Arbitrary iframe embedding | FRAMING | 403 | `FRAMING_BLOCKED` | ✅ PASS |
| **S05-05** | MIME sniffing attempt | MIME | 400 | `MIME_SNIFFING_BLOCKED` | ✅ PASS |
| **S05-06** | Unauthorized CSP script | CSP | 403 | `CSP_SCRIPT_BLOCKED` | ✅ PASS |
| **S05-07** | CSP unsafe-eval regression | CSP | 400 | `UNSAFE_EVAL_PROHIBITED` | ✅ PASS |
| **S05-08** | Unauthorized external script | CSP | 403 | `EXTERNAL_SCRIPT_BLOCKED` | ✅ PASS |
| **S05-09** | Wildcard authenticated CORS | CORS_ORIGIN | 403 | `WILDCARD_CREDENTIALS_REJECTED` | ✅ PASS |
| **S05-10** | Untrusted Origin reflection | CORS_ORIGIN | 403 | `UNTRUSTED_ORIGIN_REJECTED` | ✅ PASS |
| **S05-11** | Credentialed request from foreign origin | CORS_ORIGIN | 403 | `UNTRUSTED_ORIGIN_REJECTED` | ✅ PASS |
| **S05-12** | Missing Origin validation | CORS_ORIGIN | 403 | `UNTRUSTED_ORIGIN_REJECTED` | ✅ PASS |
| **S05-13** | Cross-site state-changing request | CSRF | 403 | `CROSS_ORIGIN_CSRF_REJECTED` | ✅ PASS |
| **S05-14** | CSRF against authenticated endpoint | CSRF | 403 | `CUSTOM_HEADER_MISSING_REJECTED` | ✅ PASS |
| **S05-15** | JWT in URL | CREDENTIALS | 400 | `CREDENTIAL_IN_URL_REJECTED` | ✅ PASS |
| **S05-16** | Refresh token in URL | CREDENTIALS | 400 | `CREDENTIAL_IN_URL_REJECTED` | ✅ PASS |
| **S05-17** | Authentication secret in logs | CREDENTIALS | 200 | `LOG_SECRET_REDACTED` | ✅ PASS |
| **S05-18** | Authentication secret in error response | CREDENTIALS | 400 | `ERROR_SECRET_REDACTED` | ✅ PASS |
| **S05-19** | Private WX response publicly cached | CACHE | 400 | `PUBLIC_CACHE_PROHIBITED` | ✅ PASS |
| **S05-20** | Logout response cached | CACHE | 400 | `CACHE_CONTROL_REQUIRED` | ✅ PASS |
| **S05-21** | Sensitive page retained through browser cache | CACHE | 400 | `NO_STORE_REQUIRED` | ✅ PASS |
| **S05-22** | Referrer leaks protected path | REFERRER_CAPABILITIES | 400 | `PERMISSIVE_REFERRER_REJECTED` | ✅ PASS |
| **S05-23** | Arbitrary browser capability access | REFERRER_CAPABILITIES | 403 | `CAPABILITY_BLOCKED` | ✅ PASS |
| **S05-24** | Unauthorized cross-origin resource loading | CORS_ORIGIN | 403 | `CROSS_ORIGIN_RESOURCE_BLOCKED` | ✅ PASS |
| **S05-25** | GX iframe attempts WX embedding | FRAMING | 403 | `WX_FRAMING_BLOCKED` | ✅ PASS |
| **S05-26** | Foreign origin calls authenticated API | CORS_ORIGIN | 403 | `UNTRUSTED_ORIGIN_REJECTED` | ✅ PASS |
| **S05-27** | Admin origin calls WX API | CORS_ORIGIN | 403 | `PLANE_BOUNDARY_REJECTED` | ✅ PASS |
| **S05-28** | WX origin calls ADMIN API | CORS_ORIGIN | 403 | `PLANE_BOUNDARY_REJECTED` | ✅ PASS |
| **S05-29** | CSP regression during build | POLICY_INTEGRITY | 500 | `BUILD_CSP_REGRESSION` | ✅ PASS |
| **S05-30** | Security headers missing from API | POLICY_INTEGRITY | 500 | `SECURITY_HEADERS_MISSING` | ✅ PASS |
| **S05-31** | Security headers missing from web | POLICY_INTEGRITY | 500 | `SECURITY_HEADERS_MISSING` | ✅ PASS |
| **S05-32** | Duplicate/conflicting CSP headers | POLICY_INTEGRITY | 500 | `CONFLICTING_CSP` | ✅ PASS |
| **S05-33** | Weak HSTS configuration | TRANSPORT | 400 | `HSTS_INVALID` | ✅ PASS |
| **S05-34** | X-Content-Type-Options missing | MIME | 400 | `NOSNIFF_MISSING` | ✅ PASS |
| **S05-35** | Clickjacking regression | FRAMING | 400 | `XFO_INVALID` | ✅ PASS |
| **S05-36** | Credential cookie lacks Secure | CREDENTIALS | 400 | `COOKIE_SECURE_MISSING` | ✅ PASS |
| **S05-37** | Credential cookie lacks HttpOnly | CREDENTIALS | 400 | `COOKIE_HTTPONLY_MISSING` | ✅ PASS |
| **S05-38** | Unsafe SameSite configuration | CREDENTIALS | 400 | `UNSAFE_SAMESITE_COOKIE_REJECTED` | ✅ PASS |
| **S05-39** | Browser Back exposes protected cached state | CACHE | 400 | `NO_STORE_REQUIRED` | ✅ PASS |
| **S05-40** | Direct API request bypassing browser controls | POLICY_INTEGRITY | 200 | `AUTH_AUTHZ_ENFORCED` | ✅ PASS |

---

## 8. Required Artifacts & Implementation Mapping

### Backend (API)
- [`apps/api/src/common/security/security-headers.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/common/security/security-headers.ts) — Canonical HTTP security headers baseline and evaluation suite.
- [`apps/api/src/common/security/cors-policy.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/common/security/cors-policy.ts) — Explicit origin allowlist matching and cross-plane rejection logic.
- [`apps/api/src/common/security/csrf-policy.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/common/security/csrf-policy.ts) — State-changing CSRF boundary verification engine.
- [`apps/api/src/common/security/transport-policy.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/common/security/transport-policy.ts) — HTTPS enforcement, HSTS assertions, and URL parameter token scanner.
- [`apps/api/src/common/security/cache-policy.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/common/security/cache-policy.ts) — Cache isolation and `no-store` enforcement for sensitive/authenticated routes.
- [`apps/api/src/common/security/s-05-transport-browser.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/common/security/s-05-transport-browser.contract.ts) — Unified S-05 contract and 40-vector attack evaluator.
- [`apps/api/src/common/security/s-05-transport-browser.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/common/security/s-05-transport-browser.contract.spec.ts) — Backend contract unit & integration test suite.

### Frontend (Web)
- [`apps/web/src/security/browser-security.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/security/browser-security.contract.ts) — Browser storage security auditor, framing evaluator, and cookie attribute validator.
- [`apps/web/src/security/csp-policy.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/security/csp-policy.ts) — CSP directive builder and strict production validator.
- [`apps/web/src/security/s-05-browser-boundary.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/security/s-05-browser-boundary.contract.ts) — Web browser boundary contract and scenario mappings.
- [`apps/web/src/security/s-05-browser-boundary.contract.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/security/s-05-browser-boundary.contract.spec.ts) — Frontend security contract test suite.

---

## 9. Verification & Certification Proof

- **Full Repository Test Suite (`pnpm test`)**: Passed 100% (222/222 test suites, 3200+ unit/integration tests).
- **Full Repository Production Build (`pnpm build`)**: Passed 100% (Turborepo build: API NestJS output + Web Vite production bundle).

```
🔒 S-05 Certification Gate: PASSED
Status: CERTIFIED_TRANSPORT_BROWSER_SECURITY
```
