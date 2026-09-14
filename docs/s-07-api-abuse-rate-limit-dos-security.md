# S-07 — API Abuse, Rate Limiting & DoS Resistance

**Ticket ID:** `S-07`  
**Phase:** Production Security Hardening  
**Priority:** P0 — BLOCKING  
**Type:** Security / API / Abuse Prevention / Rate Limiting / DoS / Backend / Contract  
**Depends on:** S-01 🔒, S-02 🔒, S-03 🔒, S-04 🔒, S-05 🔒, S-06 🔒  
**Blocks:** S-08 → S-12 and Production Release  
**Status:** 🔒 **`CERTIFIED_API_ABUSE_RATE_LIMIT_DOS_SECURITY`**

---

## 1. Canonical Certification Gate & Statement

> **Canonical Certification Statement:**  
> *"Every externally reachable Nebula operation is protected against uncontrolled request volume, resource exhaustion, credential abuse, enumeration, replay, and application-layer denial of service through server-enforced, identity-aware, endpoint-aware, and fail-closed abuse controls."*

> **Secondary Certification Gate:**  
> *"Nebula remains available under hostile request conditions because every externally reachable operation has bounded resource consumption, identity-aware admission control, endpoint-specific rate policies, concurrency limits, timeout enforcement, retry protection, and fail-closed degradation. GX, WX, and ADMIN cannot borrow or bypass one another's abuse boundaries."*

### Frozen Principle: "Availability is part of security"
Authentication alone does not make an endpoint safe. A valid authenticated user can still flood an endpoint, exhaust worker capacity, consume database connections, trigger expensive understanding jobs, abuse guest discovery, brute-force credentials, repeatedly refresh sessions, enumerate resources, create unbounded asynchronous work, or intentionally exhaust memory or CPU.

Therefore, **S-07 establishes the abuse boundary around the already-secured system** and sits strictly before expensive backend work (database resources, worker slots, external network probes, understanding jobs, crypto operations, and expensive queries).

---

## 2. Canonical Abuse-Control Architecture

```
                    EXTERNAL REQUEST
                           │
                           ▼
                 ┌───────────────────┐
                 │ Transport Limits  │ (S-05)
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Request Integrity │ (S-04)
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Abuse Detection   │
                 │ & Rate Limiting   │ (S-07)
                 └─────────┬─────────┘
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
          Authentication          Guest Context (GX)
             (S-02)                  │
                 │                   │
                 └─────────┬─────────┘
                           ▼
                    Authorization (S-03)
                           │
                           ▼
                     Business Logic
                           │
                           ▼
                    Resource Control
                           │
                           ▼
                         DB / Jobs
```

---

## 3. P0 Security Invariants (S07-I01 → S07-I15)

| Invariant | Title | Standard & Posture | Enforcement Mechanism | Fail-Closed Decision |
|:---|:---|:---|:---|:---|
| **S07-I01** | **Server-Enforced Rate Limits** | Authoritative Server-Side Control | `RateLimiterEngine` rejects client headers; frontend throttling is never a security control | `SERVER_ENFORCED_RATE_LIMIT` |
| **S07-I02** | **Identity-Aware Limiting** | Principal-Aware Boundaries | Distinguishes `ANONYMOUS`, `GUEST`, `USER`, and `ADMIN` security principals | `IDENTITY_AWARE_LIMIT_ENFORCED` |
| **S07-I03** | **Endpoint-Specific Policies** | Cost-Tailored Rate Profiles | Custom policies for Login (5/min), Register (3/min), Refresh (30/min), Understand (3/hr), CRUD (60/min), Admin (120/min) | `ENDPOINT_POLICY_ENFORCED` |
| **S07-I04** | **Understanding Job Protection** | Quota + Concurrency Gate | Enforces hourly job ceilings and concurrency slots before dispatching worker tasks | `JOB_ADMISSION_ENFORCED` |
| **S07-I05** | **Concurrent Work Limits** | Principal Concurrency Caps | `ConcurrencyLimiter` caps simultaneous jobs (Guest: 1, User: 2, Admin: 5, Global: 50) | `CONCURRENCY_LIMIT_ENFORCED` |
| **S07-I06** | **Queue Admission Control** | Queue Depth & Deduplication | `JobQuotaManager` enforces 5-min deduplication window, capacity limits, and job timeouts | `QUEUE_ADMISSION_ENFORCED` |
| **S07-I07** | **Retry Amplification Protection** | Exponential Backoff with Jitter | `RetryPolicy` caps retries at 3 and prohibits retrying client/auth errors (400, 401, 403, 404, 422) | `RETRY_CEILING_ENFORCED` |
| **S07-I08** | **Brute-Force Resistance** | Credential Stuffing Defense | `AbuseDetector` tracks consecutive failures and triggers progressive quarantine after 5 attempts | `BRUTE_FORCE_BLOCKED` |
| **S07-I09** | **Enumeration Resistance** | Uniform Timing & Responses | Rejections match S-03 contracts without revealing account/resource existence | `ENUMERATION_ORACLE_PREVENTED` |
| **S07-I10** | **Distributed Abuse Resistance** | Multi-Dimensional Tracking | Correlates IP, principal ID, guest session ID, user agent, and target identity | `DISTRIBUTED_ABUSE_BLOCKED` |
| **S07-I11** | **Resource Exhaustion Protection** | DB Pool & Memory Defense | `AdmissionControl` reserves DB connections and sheds low-priority traffic under load | `RESOURCE_EXHAUSTION_BLOCKED` |
| **S07-I12** | **Timeout Enforcement** | Upper Bound Execution Cap | `RequestTimeoutManager` bounds HTTP (15s), reports (30s), discovery probes (10s), and jobs (120s) | `TIMEOUT_ENFORCED` |
| **S07-I13** | **Global Emergency Protection** | Circuit Breakers & Overload Shedding | `CircuitBreaker` and `AdmissionControl` shed non-essential load during system distress | `EMERGENCY_PROTECTION_ENGAGED` |
| **S07-I14** | **429 Contract** | Safe HTTP 429 Payload | Returns uniform 429 with safe `Retry-After` without exposing worker counts or internal state | `SAFE_429_RESPONSE_CONTRACT` |
| **S07-I15** | **Fail-Closed Abuse Controls** | Zero-Degrade Fallback | If limiter or admission storage is unavailable, critical endpoints restrict admission | `FAIL_CLOSED_ABUSE_CONTROL` |

---

## 4. Cross-Plane Abuse Separation Matrix

```
                    S-07
             ABUSE CONTROL PLANE
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
      GX             WX            ADMIN
       │              │              │
 Guest quota      User quota     Admin quota
 (1 concurrent,  (2 concurrent,  (5 concurrent,
  3 jobs / hr)    30 jobs / hr)   500 jobs / hr)
       │              │              │
       X──────────────X──────────────X
          NO QUOTA / IDENTITY BORROWING
```

- **GX Plane:** Strict 3 jobs/hr quota, 1 concurrent execution slot, 5-minute deduplication window. Cannot borrow WX quota.
- **WX Plane:** 30 jobs/hr quota, 2 concurrent execution slots, session-aware limits. Cannot borrow ADMIN quota.
- **ADMIN Plane:** Dedicated admin policy (120 req/min, 5 concurrent jobs, 500 jobs/hr), reserved DB pool slots under distress.

---

## 5. 50-Vector Attack Matrix Results (S07-01 → S07-50)

| Vector ID | Scenario | Category | Expected Decision | Result |
|:---|:---|:---:|:---|:---:|
| **S07-01** | Anonymous request flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-02** | Single IP burst attack | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-03** | Distributed IP flooding | ABUSE_DETECTION | `DISTRIBUTED_ABUSE_BLOCKED` | ✅ PASS |
| **S07-04** | Guest session flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-05** | Guest session rotation bypass | ABUSE_DETECTION | `IP_PRINCIPAL_CORRELATED_BLOCK` | ✅ PASS |
| **S07-06** | User request flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-07** | Session rotation bypass | RATE_LIMIT | `PRINCIPAL_LIMIT_ENFORCED` | ✅ PASS |
| **S07-08** | Login brute force | ABUSE_DETECTION | `BRUTE_FORCE_BLOCKED` | ✅ PASS |
| **S07-09** | Credential stuffing | ABUSE_DETECTION | `BRUTE_FORCE_BLOCKED` | ✅ PASS |
| **S07-10** | Registration flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-11** | OAuth initiation flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-12** | Refresh endpoint flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-13** | Password-reset flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-14** | Verification-token abuse | ABUSE_DETECTION | `BRUTE_FORCE_BLOCKED` | ✅ PASS |
| **S07-15** | Guest understand flooding | JOB_QUOTA | `HOURLY_QUOTA_EXCEEDED` | ✅ PASS |
| **S07-16** | Authenticated understand flooding | JOB_QUOTA | `HOURLY_QUOTA_EXCEEDED` | ✅ PASS |
| **S07-17** | Duplicate understand submission | JOB_QUOTA | `DUPLICATE_SUPPRESSED` | ✅ PASS |
| **S07-18** | Concurrent understanding exhaustion | CONCURRENCY | `CONCURRENCY_EXCEEDED` | ✅ PASS |
| **S07-19** | Worker queue flooding | CONCURRENCY | `GLOBAL_CAPACITY_EXCEEDED` | ✅ PASS |
| **S07-20** | Global queue exhaustion | RESOURCE_CONTROL | `SHED_OVERLOAD_CRITICAL` | ✅ PASS |
| **S07-21** | Retry amplification | RETRY | `MAX_RETRIES_EXCEEDED` | ✅ PASS |
| **S07-22** | Infinite retry loop | RETRY | `MAX_RETRIES_EXCEEDED` | ✅ PASS |
| **S07-23** | Long-running job | TIMEOUT | `TIMEOUT_ENFORCED` | ✅ PASS |
| **S07-24** | External probe timeout | TIMEOUT | `TIMEOUT_ENFORCED` | ✅ PASS |
| **S07-25** | Slow request exhaustion | TIMEOUT | `TIMEOUT_ENFORCED` | ✅ PASS |
| **S07-26** | Connection exhaustion | RESOURCE_CONTROL | `SHED_DB_POOL_SATURATED` | ✅ PASS |
| **S07-27** | DB pool exhaustion | RESOURCE_CONTROL | `SHED_DB_POOL_SATURATED` | ✅ PASS |
| **S07-28** | Expensive query flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-29** | Batch request abuse | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-30** | Large valid payload repetition | RESOURCE_CONTROL | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-31** | Rate-limit header manipulation | RATE_LIMIT | `SERVER_ENFORCED_RATE_LIMIT` | ✅ PASS |
| **S07-32** | Client-controlled identity for quota | RATE_LIMIT | `CLIENT_IDENTITY_IGNORED` | ✅ PASS |
| **S07-33** | User ID quota bypass | RATE_LIMIT | `IDENTITY_AWARE_LIMIT_ENFORCED` | ✅ PASS |
| **S07-34** | Guest ID quota bypass | RATE_LIMIT | `IDENTITY_AWARE_LIMIT_ENFORCED` | ✅ PASS |
| **S07-35** | Multiple sessions bypass | RATE_LIMIT | `PRINCIPAL_LIMIT_ENFORCED` | ✅ PASS |
| **S07-36** | Multiple accounts bypass | ABUSE_DETECTION | `DISTRIBUTED_ABUSE_BLOCKED` | ✅ PASS |
| **S07-37** | API direct-call bypass | RATE_LIMIT | `SERVER_ENFORCED_RATE_LIMIT` | ✅ PASS |
| **S07-38** | Frontend throttling bypass | RATE_LIMIT | `SERVER_ENFORCED_RATE_LIMIT` | ✅ PASS |
| **S07-39** | Rate limiter unavailable | FAIL_CLOSED | `FAIL_CLOSED_ABUSE_CONTROL` | ✅ PASS |
| **S07-40** | Counter storage unavailable | FAIL_CLOSED | `FAIL_CLOSED_ABUSE_CONTROL` | ✅ PASS |
| **S07-41** | Race in rate-limit counter | RATE_LIMIT | `ATOMIC_DECISION_ENFORCED` | ✅ PASS |
| **S07-42** | Concurrent requests bypass limit | RATE_LIMIT | `ATOMIC_DECISION_ENFORCED` | ✅ PASS |
| **S07-43** | Clock manipulation | RATE_LIMIT | `SERVER_TIME_ENFORCED` | ✅ PASS |
| **S07-44** | Enumeration through 429 differences | ABUSE_DETECTION | `ENUMERATION_ORACLE_PREVENTED` | ✅ PASS |
| **S07-45** | Retry-After information leakage | RATE_LIMIT | `SAFE_429_RESPONSE_CONTRACT` | ✅ PASS |
| **S07-46** | Admin endpoint flooding | RATE_LIMIT | `RATE_LIMIT_EXCEEDED` | ✅ PASS |
| **S07-47** | Cross-plane quota borrowing | PLANE_ISOLATION | `CROSS_PLANE_BORROWING_BLOCKED` | ✅ PASS |
| **S07-48** | Worker starvation by one principal | CONCURRENCY | `CONCURRENCY_EXCEEDED` | ✅ PASS |
| **S07-49** | Emergency global overload | RESOURCE_CONTROL | `EMERGENCY_PROTECTION_ENGAGED` | ✅ PASS |
| **S07-50** | Direct API DoS attempt | RATE_LIMIT | `SERVER_ENFORCED_RATE_LIMIT` | ✅ PASS |

---

## 6. Verification Summary

```
================================================================================
🔒 S-07 API ABUSE, RATE LIMITING & DOS RESISTANCE VERIFICATION SUMMARY
================================================================================
Server-Enforced Rate Limits       ✅ CERTIFIED
Identity-Aware Limiting           ✅ CERTIFIED
Endpoint-Specific Policies        ✅ CERTIFIED
Understanding Job Admission       ✅ CERTIFIED
Concurrency Limits & Leasing      ✅ CERTIFIED
Job Queue & Deduplication         ✅ CERTIFIED
Retry Amplification Defense       ✅ CERTIFIED
Multi-Dimensional Abuse Detection ✅ CERTIFIED
Enumeration Resistance            ✅ CERTIFIED
Resource Exhaustion & DB Pool     ✅ CERTIFIED
Timeout Enforcement (Bounds)      ✅ CERTIFIED
Circuit Breakers & Emergency Shed ✅ CERTIFIED
Safe HTTP 429 Contract            ✅ CERTIFIED
Fail-Closed Resilience            ✅ CERTIFIED
GX / WX / ADMIN Abuse Isolation   ✅ CERTIFIED
Direct API Protection             ✅ CERTIFIED
Full Regression Suite             ✅ 100% PASSING (0 FAILING)
Production Build                  ✅ CLEAN EXIT (Code 0)
================================================================================
```
