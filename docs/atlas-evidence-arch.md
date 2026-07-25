# Atlas Evidence Architecture Specification (v1.0)
**Architecture Decision Record (ADR-005)**  
**Status**: FROZEN & APPROVED  
**Date**: July 24, 2026  
**Authors**: Antigravity AI Core Architecture Team  

---

## 1. Executive Summary & Core Principles

The **Atlas Evidence Architecture** establishes the foundational contract for evidence collection, normalization, rule evaluation, and finding explainability across the Atlas platform.

Historically, discovery modules normalized observations directly into boolean or string primitives (e.g., `"hsts": false`), creating ambiguity between negative observations, collection failures, network timeouts, and incomplete redirect chains.

Atlas Evidence Architecture v1.0 eliminates implicit assumptions by enforcing four immutable engineering principles:

```
[Observation] ──► [Raw Evidence] ──► [Normalization] ──► [Observed Facts] ──► [Rule Evaluation] ──► [Finding + Proof]
```

### Core Principles
1. **Principle 1 — Evidence First**: Every conclusion must originate from verifiable, stored evidence.
2. **Principle 2 — Never Fabricate**: Atlas must never invent facts. When evidence is unavailable or collection fails, Atlas explicitly returns `UNKNOWN` or `FAILED` instead of default fallbacks (`false`/`0`/`null`).
3. **Principle 3 — 100% Explainability**: Every finding must maintain direct lineage back to raw evidence, enabling the UI to explain exactly *why* a finding was generated.
4. **Principle 4 — Deterministic Rule Processing**: Rules evaluate only normalized observation facts. Rules must never perform network I/O, make heuristic inferences, or guess missing data.

---

## 2. Evidence Lifecycle

```
┌─────────────────┐       ┌─────────────────┐       ┌───────────────────┐
│ Discovery Module│ ──►   │  Raw Evidence   │ ──►   │   Normalization   │
│   (Collector)   │       │   Immutable     │       │     Engine        │
└─────────────────┘       └─────────────────┘       └───────────────────┘
                                                              │
                                                              ▼
┌─────────────────┐       ┌─────────────────┐       ┌───────────────────┐
│ Experience API  │ ◄──   │ Findings Engine │ ◄──   │  Observed Facts   │
│  & UI Lineage   │       │ (Deterministic) │       │ (4-State Contract)│
└─────────────────┘       └─────────────────┘       └───────────────────┘
```

1. **Collector Stage**: Network probes gather raw protocol data without altering or interpreting payloads.
2. **Raw Evidence Storage**: Unmodified response headers, DNS records, TLS certificates, and HTTP response bodies are stored as immutable audit artifacts.
3. **Normalization Stage**: The Normalizer parses raw evidence into structured `ObservedFact` instances, recording explicit observation states.
4. **Observed Facts Contract**: Facts represent explicit state (`OBSERVED`, `MISSING`, `UNKNOWN`, `FAILED`).
5. **Rule Engine Stage**: Pure, stateless rule functions evaluate `ObservedFact` arrays and output findings with explicit proof references.
6. **Experience APIs**: Expose findings alongside full evidence lineage drill-down paths for frontend rendering.

---

## 3. Evidence Taxonomy

Evidence is classified into six distinct categories:

| Taxonomy Category | Scope & Description | Examples of Captured Raw Artifacts |
| :--- | :--- | :--- |
| **DNS Evidence** | Authoritative name server responses | Raw RRsets (A, AAAA, MX, NS, TXT, CNAME), TTLs, Resolver IP |
| **HTTP Evidence** | Transport & application layer response metadata | HTTP status, raw response headers, redirect chains, body size |
| **TLS Evidence** | Cryptographic certificate parameters | Complete certificate chain, Subject, Issuer, SANs, Signature Alg, Expiry |
| **Technology Evidence** | Fingerprint matches & headers | Server headers, meta tags, script signatures, cookie patterns |
| **Metadata Evidence** | Collection environment metrics | Collector instance ID, probe IP, execution timestamp, target domain |
| **Timing Evidence** | Latency & protocol durations | Connection duration, DNS lookup duration, TLS handshake duration |

---

## 4. Observation Model (4-State Contract)

Every observed value in Atlas must be represented using the explicit 4-state `Observation<T>` contract:

```typescript
export type ObservationState = 'OBSERVED' | 'MISSING' | 'UNKNOWN' | 'FAILED';

export interface Observation<T> {
  state: ObservationState;
  value?: T;
  rawRef?: string; // Reference to raw evidence payload
  failureReason?: string; // Populated when state === 'FAILED'
  observedAt: Date;
}
```

### State Semantics
- **`OBSERVED`**: The protocol probe succeeded and the target property was explicitly present in the response (e.g. `Strict-Transport-Security` header found with value `max-age=31536000`).
- **`MISSING`**: The protocol probe succeeded, but the target property was explicitly absent in the response (e.g. HTTP 200 returned without `Strict-Transport-Security` header).
- **`UNKNOWN`**: The protocol probe could not determine presence/absence due to external ambiguity (e.g. target returned HTTP 503 Service Unavailable or connection reset).
- **`FAILED`**: The collector encountered an internal execution failure or timeout (e.g. DNS resolver timeout, socket error).

---

## 5. Confidence Model

Confidence scores quantify the mathematical certainty of an observation or finding:

$$\text{Confidence} \in [0.0, 1.0]$$

1. **Deterministic Protocol Observations** (e.g. HSTS header presence, DNS record existence): Always assigned a fixed confidence of **`1.0`**.
2. **Heuristic/Inferred Observations** (e.g. WAF detection via header patterns, technology fingerprinting): Assigned variable confidence based on pattern match density (e.g., **`0.85`**).
3. **Finding Inheritance**: A finding inherits the minimum confidence score among all input observations used to evaluate the rule:
   $$\text{Confidence}_{\text{finding}} = \min(\text{Confidence}_{\text{obs}_1}, \text{Confidence}_{\text{obs}_2}, \dots)$$

---

## 6. Normalization Layer Specifications

### Allowed Transformations
- Case-insensitivity normalization for HTTP header names (`strict-transport-security` -> `hsts`).
- Sorting string arrays (e.g. IP addresses, name servers) deterministically.
- Parsing ISO-8601 date strings for certificate validity bounds.

### Prohibited Transformations
- Injecting default boolean values (`false`) when a collector fails.
- Inferring missing headers from redirect bodies.
- Altering raw header value strings or encoding bytes.

---

## 7. Rule Engine Contract

Rule engine functions evaluate pure `ObservedFact` structures and return 3-state evaluation results:

```typescript
export type RuleEvaluationResult = 'MATCH' | 'NO_MATCH' | 'UNKNOWN';

export interface RuleEvaluationOutput {
  ruleId: string;
  result: RuleEvaluationResult;
  finding?: FindingProposal;
  evidenceReferences: string[]; // IDs of input observations used
  reason: string;
}
```

- **`MATCH`**: Rule condition met (e.g. HSTS header state is `MISSING`). Finding is generated.
- **`NO_MATCH`**: Rule condition not met (e.g. HSTS header state is `OBSERVED`). No finding generated.
- **`UNKNOWN`**: Rule cannot evaluate because required observation state is `UNKNOWN` or `FAILED`. No finding generated; logged for diagnostic review.

---

## 8. Finding Evidence Model & Explainability Lineage

Every finding record must contain full lineage references back to the exact observations and raw evidence payloads that triggered it:

```
[Finding Record]
   ├── ruleId: "http-missing-hsts"
   ├── severity: "HIGH"
   ├── evidenceLineage:
   │     ├── observationId: "obs-header-hsts-123"
   │     ├── state: "MISSING"
   │     └── rawPayloadRef: "raw-http-resp-998"
   └── explanation: "Target HTTP response returned status 200 OK without Strict-Transport-Security header."
```

This guarantees 100% explainability in frontend user interfaces.

---

## 9. Persistence & Storage Strategy

- **Raw Evidence Layer**: Persisted in compressed JSON/Blob storage (`raw_evidence` table) with immutable write-once semantics.
- **Observed Facts Layer**: Stored as relational JSONB columns indexed by `domainId` and `snapshotId`.
- **Retention**: Raw evidence retained for 90 days; normalized facts and findings retained permanently.

---

## 10. API Philosophy & Drill-down Capabilities

Future Atlas APIs will expose hierarchical drill-down capabilities enabling users to inspect findings at any level of detail:

$$\text{Finding} \longrightarrow \text{Rule Output} \longrightarrow \text{Observed Fact} \longrightarrow \text{Raw Protocol Payload}$$

### Endpoint Contract Blueprint
- `GET /api/v1/findings/:id` -> Returns finding summary.
- `GET /api/v1/findings/:id/evidence` -> Returns underlying `ObservedFact` array and raw header/DNS references.

---

## 11. Coding Standards Impact

1. **Rule #1**: Never use default boolean fallbacks (`false`) for missing or failed protocol checks.
2. **Rule #2**: Every discovery module must return the 4-state `Observation<T>` contract.
3. **Rule #3**: Rule engine modules must never perform network requests or mutate state.
4. **Rule #4**: Every finding constructor must mandate an `evidenceReferences` array.

---

## 12. Migration Strategy (v0.9 -> v1.0)

- **Phase 1 (Architecture Freeze)**: Approve ADR-005 specification (Current Phase).
- **Phase 2 (Collector Refactoring)**: Refactor discovery modules to wrap raw responses in `Observation<T>` contracts.
- **Phase 3 (Normalizer & Schema Migration)**: Deploy `raw_evidence` tables and updated `ObservedFact` mappers.
- **Phase 4 (Rule Engine Upgrade)**: Update rule evaluation functions to handle 3-state output (`MATCH`, `NO_MATCH`, `UNKNOWN`).
- **Phase 5 (Experience API Verification)**: Expose evidence lineage endpoints to frontend apps.

---

## 13. Freeze Declaration

This specification represents the immutable **Atlas Evidence Architecture Specification v1.0**. All future backend discovery modules, rule engines, persistence schemas, and API contracts must comply strictly with this document.
