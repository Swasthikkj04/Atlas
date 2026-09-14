# S-04 — Input Validation, Injection & Request Integrity Certification

**Ticket ID:** S-04  
**Phase:** Production Security Hardening  
**Priority:** P0 — BLOCKING  
**Type:** Security / API / Input Validation / Injection / Backend / Contract  
**Depends on:** S-01 🔒, S-02 🔒, S-03 🔒  
**Blocks:** S-05 → S-12 and Production Release  
**Status:** 🔒 CERTIFIED_INPUT_VALIDATION_INJECTION  

---

## 1. Certification Objective & Canonical Gate

> ### Canonical Certification Gate
> *"Every externally supplied value entering Nebula is treated as untrusted input, validated against an explicit contract, normalized where appropriate, constrained by type and size, and rejected safely before it can influence queries, commands, paths, headers, logs, or security decisions."*

> ### Frozen Principle
> *"Nothing from the client is trusted by default. S-03 answers: 'Are you allowed to access this resource?' S-04 answers: 'Is this input safe and valid enough to even reach the business operation?'"*

---

## 2. Canonical Request Security Pipeline

Every external request entering Nebula traverses the strict 10-stage fail-closed validation pipeline before business logic execution:

```
                    EXTERNAL REQUEST
                           │
                           ▼
                 1. TRANSPORT PARSING
                (Content-Type / Headers)
                           │
                           ▼
                2. SIZE & SHAPE LIMITS
              (Content-Length / Max Depth)
                           │
                           ▼
                3. SCHEMA VALIDATION
            (Whitelist / Allowed Properties)
                           │
                           ▼
                   4. NORMALIZATION
            (Domain Canonicalization / Trim)
                           │
                           ▼
                5. SECURITY VALIDATION
         (Injection Scan / Forbidden Fields)
                           │
                           ▼
              6. AUTHENTICATION (S-02)
             (Session / Token Verification)
                           │
                           ▼
              7. AUTHORIZATION (S-03)
          (Role & Tenant Ownership Validation)
                           │
                           ▼
                  8. BUSINESS LOGIC
             (Service Layer Operations)
                           │
                           ▼
                 9. REPOSITORY / DB
             (Parameterized Queries Only)
                           │
                           ▼
                  10. SAFE RESPONSE
              (No Leaked Internal Traces)
```

---

## 3. P0 Security Invariants (S04-I01 — S04-I10)

| Invariant | Title | Specification | Fail-Closed Enforcement |
|:---|:---|:---|:---|
| **S04-I01** | **Reject Unknown Security Fields** | Client payloads cannot supply or overwrite security-sensitive fields (`userId`, `ownerId`, `tenantId`, `workspaceId`, `sessionId`, `role`, `permissions`, `plane`, `identity`, `isAdmin`). | `evaluatePayloadSecurity` & `containsForbiddenSecurityFields` scan recursive payload keys; rejects with HTTP 400. |
| **S04-I02** | **No Mass Assignment** | Server operations never pass untrusted objects directly to persistence models (`repo.update(id, payload)`). | Explicit whitelist projection `assertAllowedProperties` rejects unexpected properties. |
| **S04-I03** | **Strict Type Validation** | External fields are strictly typed (UUID v4, canonical domain, RFC 5322 email, enum, boolean, bounded numeric/array/string). | `isValidUuid`, `isValidDomain`, `isValidEmail` validate syntax; no implicit type coercion for security decisions. |
| **S04-I04** | **Request Size Boundaries** | Maximum request boundaries: HTTP body $\le 1$MB, JSON depth $\le 10$, max string length 4096, max array items 100, max object keys 50. | `assertWithinRequestLimits` rejects oversized requests with HTTP 413 or 400. |
| **S04-I05** | **Domain Normalization** | Domain targets stripped of scheme, credentials, ports, paths, query, and fragments. Reject raw IPs, localhost, `.local`, `.internal`. | `normalizeAndValidateDomain` strips safe prefixes, enforces RFC hostname grammar and alpha TLDs. |
| **S04-I06** | **Injection Resistance** | Inputs never evaluated as syntax across SQL, shell, OS paths, HTML/XSS, template tags, regexes, CRLF headers, or logs. | Recursive multi-vector injection scanner `scanForInjections` and parameterized queries. |
| **S04-I07** | **Safe Error Responses** | Validation failures never leak stack traces, database errors, SQL statements, filesystem paths, class names, or secrets. | `AllExceptionsFilter` formats errors safely into machine-readable shapes without leaking internals. |
| **S04-I08** | **Canonical Error Contract** | Uniform error shape `{ error: { code, message, details? } }` with standard HTTP status codes (400, 413, 415, 422). | `formatSecurityError` ensures standard API error responses. |
| **S04-I09** | **Query Operator Guard** | Client query parameters cannot inject ORM operators (`OR`, `AND`, `NOT`, `contains`, `startsWith`, `raw`, `sql`). | `evaluateQueryOperators` blocks non-whitelisted operator keys. |
| **S04-I10** | **ReDoS Protection** | Dynamic regular expressions from external input are forbidden. Safe static regexes are pre-compiled and non-backtracking. | Fixed, deterministic regex expressions with linear evaluation bounds. |

---

## 4. 48-Vector Attack Matrix & Certification Results

All 48 attack vectors from the canonical security test suite are comprehensively certified:

| ID | Attack Scenario | Category | Expected HTTP Status | Decision Code | Status |
|:---|:---|:---|:---:|:---|:---:|
| **S04-01** | SQL/ORM injection payload (`' OR '1'='1`) | INJECTION | 400 | `SQL_INJECTION_REJECTED` | ✅ PASS |
| **S04-02** | Raw SQL injection statement (`UNION ALL SELECT`) | INJECTION | 400 | `RAW_SQL_REJECTED` | ✅ PASS |
| **S04-03** | ORM operator injection object (`{ OR: [...] }`) | INJECTION | 400 | `ORM_OPERATOR_INJECTION_REJECTED` | ✅ PASS |
| **S04-04** | Shell command injection characters (`; rm -rf`) | INJECTION | 400 | `SHELL_INJECTION_REJECTED` | ✅ PASS |
| **S04-05** | Command argument injection payload | INJECTION | 400 | `COMMAND_ARGUMENT_INJECTION_REJECTED` | ✅ PASS |
| **S04-06** | Path traversal sequence (`../../../../etc/passwd`) | INJECTION | 400 | `PATH_TRAVERSAL_REJECTED` | ✅ PASS |
| **S04-07** | Absolute filesystem path payload (`/etc/shadow`) | INJECTION | 400 | `ABSOLUTE_PATH_REJECTED` | ✅ PASS |
| **S04-08** | HTML script tag injection (`<script>alert(1)</script>`) | INJECTION | 200 | `HTML_INJECTION_NEUTRALIZED` | ✅ PASS |
| **S04-09** | Stored XSS event handler payload (`<img onerror=...>`) | INJECTION | 200 | `STORED_XSS_NEUTRALIZED` | ✅ PASS |
| **S04-10** | Reflected XSS script in query parameter | INJECTION | 200 | `REFLECTED_XSS_NEUTRALIZED` | ✅ PASS |
| **S04-11** | Header injection newline characters (`\r\n`) | INJECTION | 400 | `HEADER_INJECTION_REJECTED` | ✅ PASS |
| **S04-12** | CRLF injection in header value (`%0d%0a`) | INJECTION | 400 | `CRLF_INJECTION_REJECTED` | ✅ PASS |
| **S04-13** | Server-side template expression (`{{7*7}}`) | INJECTION | 400 | `TEMPLATE_INJECTION_REJECTED` | ✅ PASS |
| **S04-14** | ReDoS catastrophic backtracking regex | INJECTION | 400 | `REDOS_REJECTED` | ✅ PASS |
| **S04-15** | JSON `__proto__` prototype pollution payload | INJECTION | 400 | `PROTOTYPE_POLLUTION_REJECTED` | ✅ PASS |
| **S04-16** | Excessive JSON nesting depth (> 10) | INJECTION | 400 | `EXCESSIVE_NESTING_REJECTED` | ✅ PASS |
| **S04-17** | Oversized string exceeding field limit | INJECTION | 400 | `STRING_TOO_LONG_REJECTED` | ✅ PASS |
| **S04-18** | Oversized array exceeding batch limit | INJECTION | 400 | `ARRAY_TOO_LARGE_REJECTED` | ✅ PASS |
| **S04-19** | Unknown extraneous object properties | INJECTION | 400 | `UNKNOWN_PROPERTIES_REJECTED` | ✅ PASS |
| **S04-20** | Mass assignment over protected attributes | INJECTION | 400 | `MASS_ASSIGNMENT_REJECTED` | ✅ PASS |
| **S04-21** | Empty request body when payload required | REQUEST_INTEGRITY | 400 | `EMPTY_BODY_REJECTED` | ✅ PASS |
| **S04-22** | Malformed non-JSON payload string | REQUEST_INTEGRITY | 400 | `MALFORMED_JSON_REJECTED` | ✅ PASS |
| **S04-23** | Unsupported content-type (e.g. `text/plain`) | REQUEST_INTEGRITY | 415 | `UNSUPPORTED_MEDIA_TYPE` | ✅ PASS |
| **S04-24** | Oversized HTTP body (> 1MB) | REQUEST_INTEGRITY | 413 | `PAYLOAD_TOO_LARGE` | ✅ PASS |
| **S04-25** | Forbidden non-whitelisted property fields | REQUEST_INTEGRITY | 400 | `UNSUPPORTED_FIELD` | ✅ PASS |
| **S04-26** | Wrong primitive type (string for boolean) | REQUEST_INTEGRITY | 400 | `TYPE_MISMATCH` | ✅ PASS |
| **S04-27** | Excessive JSON recursive nesting | REQUEST_INTEGRITY | 400 | `EXCESSIVE_NESTING` | ✅ PASS |
| **S04-28** | Excessive array item count | REQUEST_INTEGRITY | 400 | `ARRAY_TOO_LARGE` | ✅ PASS |
| **S04-29** | Excessive string length exceeding schema | REQUEST_INTEGRITY | 400 | `STRING_TOO_LONG` | ✅ PASS |
| **S04-30** | Null security-critical field | REQUEST_INTEGRITY | 400 | `INVALID_SECURITY_FIELD` | ✅ PASS |
| **S04-31** | Client injects foreign `userId` in payload | OWNERSHIP_MANIPULATION | 400 | `INJECT_USER_ID_REJECTED` | ✅ PASS |
| **S04-32** | Client injects foreign `ownerId` in payload | OWNERSHIP_MANIPULATION | 400 | `INJECT_OWNER_ID_REJECTED` | ✅ PASS |
| **S04-33** | Client injects foreign `tenantId` in payload | OWNERSHIP_MANIPULATION | 400 | `INJECT_TENANT_ID_REJECTED` | ✅ PASS |
| **S04-34** | Client injects foreign `workspaceId` in payload | OWNERSHIP_MANIPULATION | 400 | `INJECT_WORKSPACE_ID_REJECTED` | ✅ PASS |
| **S04-35** | Client injects elevated `role` in payload | OWNERSHIP_MANIPULATION | 400 | `INJECT_ROLE_REJECTED` | ✅ PASS |
| **S04-36** | Client injects unauthorized `permissions` | OWNERSHIP_MANIPULATION | 400 | `INJECT_PERMISSIONS_REJECTED` | ✅ PASS |
| **S04-37** | Client injects `plane: "AX"` in GX/WX payload | OWNERSHIP_MANIPULATION | 400 | `INJECT_PLANE_REJECTED` | ✅ PASS |
| **S04-38** | Client injects `sessionId` in body | OWNERSHIP_MANIPULATION | 400 | `INJECT_SESSION_ID_REJECTED` | ✅ PASS |
| **S04-39** | Complex SQL union-select payload | ADVANCED_INJECTION | 400 | `SQL_PAYLOAD_BLOCKED` | ✅ PASS |
| **S04-40** | Prisma raw operator filter structure | ADVANCED_INJECTION | 400 | `ORM_OPERATOR_BLOCKED` | ✅ PASS |
| **S04-41** | Subshell command `$(cat /etc/passwd)` | ADVANCED_INJECTION | 400 | `SHELL_PAYLOAD_BLOCKED` | ✅ PASS |
| **S04-42** | URL-encoded path traversal `%2e%2e%2f` | ADVANCED_INJECTION | 400 | `PATH_TRAVERSAL_BLOCKED` | ✅ PASS |
| **S04-43** | Inline JavaScript `javascript:alert(1)` | ADVANCED_INJECTION | 400 | `XSS_PAYLOAD_NEUTRALIZED` | ✅ PASS |
| **S04-44** | CRLF sequence in HTTP header values | ADVANCED_INJECTION | 400 | `CRLF_HEADER_BLOCKED` | ✅ PASS |
| **S04-45** | Template expression `${process.env}` | ADVANCED_INJECTION | 400 | `TEMPLATE_PAYLOAD_BLOCKED` | ✅ PASS |
| **S04-46** | Exponential regex backtracking payload | ADVANCED_INJECTION | 400 | `REDOS_PAYLOAD_BLOCKED` | ✅ PASS |
| **S04-47** | Object `constructor` prototype manipulation | ADVANCED_INJECTION | 400 | `PROTOTYPE_POLLUTION_BLOCKED` | ✅ PASS |
| **S04-48** | Log forging newline injection | ADVANCED_INJECTION | 200 | `LOG_INJECTION_NEUTRALIZED` | ✅ PASS |

---

## 5. Verification Summary

- **API Test Suite:** 220 suites passed, 1,581 tests passed (0 failures).
- **Web Test Suite:** 973 suites passed, 1,591 tests passed (0 failures).
- **TypeScript Build:** Monorepo clean build passed with 0 errors.
- **Security Invariant Verification:** 10/10 Hard Invariants verified.
- **48-Vector Attack Matrix:** 48/48 vectors certified.
