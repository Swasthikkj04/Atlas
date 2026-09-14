# S6 — HTTP Transit & Transit Invariants

**Phase**: Security Intelligence Hardening  
**Priority**: P0 — Trust Critical  
**Status**: 🔒 CERTIFIED & COMPLETE  
**Depends on**: S5 🔒, S4 🔒, S3 🔒, S2 🔒, S1 🔒, H8 🔒, H7 🔒  
**Unlocks**: S7 — Well-Known Perimeter & Configuration Exposure 🔒

---

## 1. Objective

Implement evidence-grounded HTTP transit hygiene and transport posture rules across Nebula's discovery $\to$ finding $\to$ evidence $\to$ UI pipeline:
1. **Insecure CORS Reflection (`http.insecure-cors-policy`)**: Detecting `Access-Control-Allow-Origin: *` or arbitrary reflection when credentials (`Access-Control-Allow-Credentials: true`) are enabled — Severity `HIGH`.
2. **Dangerous HTTP Methods Exposure (`http.dangerous-methods-exposed`)**: Detecting dangerous or diagnostic HTTP methods (`TRACE`, `CONNECT`, `TRACK`) in `Allow`, `Public`, or `Access-Control-Allow-Methods` headers — Severity `MEDIUM`.
3. **Cleartext HTTP to HTTPS Upgrade Integrity (`http.cleartext-upgrade-missing`)**: Detecting domains serving cleartext HTTP on port 80 without permanent (`301` or `308`) redirection to HTTPS — Severity `MEDIUM`.

---

## 2. Golden Security Invariant

> **Observed Wire Transit Behavior $\longrightarrow$ Security Interpretation $\longrightarrow$ Finding $\longrightarrow$ Evidence-Backed Remediation**
> 
> *Never assume insecure CORS or open methods without explicit observed response headers.*  
> *Never flag cleartext upgrade missing if the domain already redirects to HTTPS with 301/308.*

---

## 3. Architecture & Components

### A. Backend Contracts & Analyzer
- **Contract**: [`http-transit.interface.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/contracts/http-transit.interface.ts)
  - `CorsPolicyAudit`: `allowOrigin`, `allowCredentials`, `allowMethods`, `isWildcardWithCredentials`, `isOverlyPermissive`
  - `AllowedMethodsAudit`: `declaredMethods`, `hasTraceMethod`, `hasConnectMethod`, `hasDangerousMethods`, `dangerousMethodsList`
  - `CleartextUpgradeAudit`: `initialProtocol`, `initialStatusCode`, `isHttpsRedirectEnforced`, `isPermanentRedirect`, `hasCleartextExposure`
  - `HttpTransitSecurityReport`: Unified evaluation report.
- **Service**: [`HttpTransitAnalyzerService`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/services/http-transit-analyzer.service.ts)
  - Evaluates CORS headers, method declarations, and redirect chains.

### B. Finding Rules
1. **[`InsecureCorsPolicyRule`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/rules/infrastructure/http/insecure-cors-policy.rule.ts)** (`http.insecure-cors-policy`):
   - Severity: `HIGH`
   - Detects wildcard `*` with credentials or null origin reflection.
2. **[`DangerousMethodsExposedRule`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/rules/infrastructure/http/dangerous-methods-exposed.rule.ts)** (`http.dangerous-methods-exposed`):
   - Severity: `MEDIUM`
   - Detects `TRACE`, `CONNECT`, or `TRACK` exposed in web server responses.
3. **[`CleartextUpgradeMissingRule`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/rules/infrastructure/http/cleartext-upgrade-missing.rule.ts)** (`http.cleartext-upgrade-missing`):
   - Severity: `MEDIUM`
   - Detects port 80 cleartext responses without 301/308 upgrade.

### C. Frontend Contracts & Invariants
- **Contract**: [`http-transit-security.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/contracts/http-transit-security.contract.ts)
- **Export**: [`contracts/index.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/contracts/index.ts)
- **Specs**: [`workspace-s6-http-transit.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-s6-http-transit.spec.ts)
- **Master Smoke Matrix**: `S6-01`, `S6-02`, `S6-03` in [`workspace-infrastructure-understanding-master.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-infrastructure-understanding-master.spec.ts).

---

## 4. Verification Suite

- **API Tests**:
  - [`http-transit-analyzer.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/services/http-transit-analyzer.spec.ts) (6/6 pass)
  - [`http-transit-rules.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/rules/infrastructure/http/http-transit-rules.spec.ts) (7/7 pass)
  - [`http-transit-lifecycle.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/findings/rules/infrastructure/http/http-transit-lifecycle.spec.ts) (1/1 pass)
- **Web Tests**:
  - [`workspace-s6-http-transit.spec.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/workspace-s6-http-transit.spec.ts) (7/7 pass)
