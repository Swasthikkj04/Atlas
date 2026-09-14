# S-09: Distributed Rate Limiting & Sliding-Window Quota Engine

## 1. Overview & Architecture

The **Distributed Rate Limiting & Sliding-Window Quota Engine** provides enterprise-grade operational resilience, abuse prevention, multi-tiered quotas, and adaptive backpressure management across Atlas.

```
Incoming Request
      │
      ▼
┌────────────────────────────────────────────────────────┐
│                   RateLimiterGuard                     │
│  - Extracts Client IP (trusted X-Forwarded-For parsing)│
│  - Identifies Security Principal (ANON/GUEST/USER/ADMIN│
│  - Resolves Endpoint Category & Policy                 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  RateLimiterService                    │
│  - Strict Fail-Closed Check for Auth Endpoints         │
│  - Adaptive Backpressure & Queue Saturation Evaluation │
│  - Composite Key Generation: tier:cat:ip:userId:route  │
└──────────────────────────┬─────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│ InMemoryRateLimiterStorage│ │DistributedRateLimiterStor.│
│ - Sliding Window Log (ms) │ │ - Redis Cluster Backplane │
│ - Token Bucket Algorithm  │ │ - Resilient Local Fallback│
│ - Auto TTL Pruning (60s)  │ │                           │
└───────────────────────────┘ └───────────────────────────┘
```

---

## 2. Multi-Tiered Quotas & Policy Matrix

| Tier | Max Domains | Max Concurrent Scans | Scans / Hour | Rate Limit / Min | Burst Allowance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ANONYMOUS** | N/A | N/A | N/A | 60 req/min | 5 |
| **GUEST** | 1 | 1 | 3 scans/hr | 60 req/min | 5 |
| **FREE** | 4 | 1 | 30 scans/hr | 60 req/min | 10 |
| **PRO** | 20 | 5 | 150 scans/hr | 180 req/min | 30 |
| **ENTERPRISE**| 500 | 20 | 1,000 scans/hr | 600 req/min | 100 |
| **API_KEY** | Per Key Tier | Per Key Tier | Unlimited | Configurable | Configurable |

---

## 3. Standard RFC 6585 & IETF RateLimit Headers

Every HTTP response emitted through `RateLimiterGuard` includes dual-format rate limiting telemetry:

### Classic Headers
- `X-RateLimit-Limit`: Maximum requests permitted in current window.
- `X-RateLimit-Remaining`: Number of requests remaining in current window.
- `X-RateLimit-Reset`: Seconds until window resets.
- `X-Workspace-Tier`: Active workspace tier (`FREE`, `PRO`, `ENTERPRISE`, `GUEST`).

### IETF Standard Headers
- `RateLimit-Limit`: Standard quota ceiling.
- `RateLimit-Remaining`: Standard quota balance.
- `RateLimit-Reset`: Seconds until quota replenishment.
- `RateLimit-Policy`: Standard policy description (e.g. `120;w=60`).
- `Retry-After`: Emitted on HTTP 429 status code indicating cooldown delay.

---

## 4. Adaptive Backpressure Protection

When asynchronous worker queues or background discovery jobs reach saturation (default threshold: 85% of worker pool capacity), the `AdaptiveBackpressureService` dynamically throttles incoming heavy discovery scans (`USER_UNDERSTAND`, `GUEST_UNDERSTAND`) while maintaining full availability for lightweight read requests (`USER_READ_ONLY`, `PUBLIC_DEFAULT`).

- **Throttling Status Code**: `429 Too Many Requests`
- **Error Code**: `BACKPRESSURE_SATURATED`
- **Response**: Recommends backoff time via `Retry-After` header without leaking internal infrastructure details.

---

## 5. Security Fail-Closed vs Fail-Open Matrix

- **Critical Authentication Endpoints** (`AUTH_LOGIN`, `AUTH_REGISTER`, `AUTH_PASSWORD_RESET`): **Fail-Closed** — If rate limiting storage backend fails, access is blocked to prevent distributed credential stuffing or brute-force attacks.
- **Public & Workspace Read Endpoints**: **Fail-Open** — Ensures uninterrupted read availability in degraded environments.

---

## 6. Frontend Quota & Cooldown UI

- **Contract**: [`workspace-quota-rate-limit.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/contracts/workspace-quota-rate-limit.contract.ts)
- **Component**: [`WorkspaceQuotaUsageWidget.tsx`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/components/quota/WorkspaceQuotaUsageWidget.tsx)
  - Interactive multi-meter gauge for domain count, scan concurrency, and API throughput.
  - Cooldown alert banner with live countdown timer when 429 or backpressure is engaged.

---

## 7. Verification & Test Metrics

- **API Rate Limiting Test Suites**: 5 passed (23 unit & integration tests)
- **Full API Test Suite**: 256 passed (2,075 tests)
- **Full Web Test Suite**: 1,078 passed (1,920 tests)
- **Compilation**: 0 TypeScript errors across both `apps/api` and `apps/web`.
