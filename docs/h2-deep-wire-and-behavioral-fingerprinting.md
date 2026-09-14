# H2: Deep Wire & Behavioral Fingerprinting Architecture & Verification Record

**Ticket**: `H2`  
**Phase**: Intelligence & Behavioral Analysis  
**Priority**: P0 — Intelligence Accuracy  
**Status**: 🟢 COMPLETE & CERTIFIED  
**Depends On**: `T1–T30` 🔒 + `H1` 🔒  
**Unblocks**: `H3 — Infrastructure Change Forensics`

---

## 1. Executive Overview & Golden Invariants

Nebula extends infrastructure understanding beyond literal banner strings (such as `Server: nginx`, `X-Powered-By: Express`, `Server: Vercel`) to corroborative wire behavior. When banners are stripped, obfuscated, or normalized by upstream proxies, Nebula corroborates infrastructure through independently observable wire telemetry.

### Golden Rule of Behavioral Attribution
```
OBSERVATION ──► FINGERPRINT ──► CORROBORATION ──► CONFIDENCE ──► UNDERSTANDING
                    (Never: Observation ──► Guess ──► Fact)
```

### Core Invariants Enforced
1. **Never Manufacture Certainty**: Behavioral evidence strengthens existing conclusions or yields calibrated `MEDIUM` confidence with explicit non-proven boundaries (`whatThisDoesNotProve`).
2. **Strict Posture Distinction**:
   - `DIRECT + BEHAVIORAL` ──► `CORROBORATED` (Confidence: `HIGH`, up to `0.98`)
   - `BEHAVIORAL ONLY` ──► `CONSISTENT` (Confidence: `MEDIUM`, calibrated e.g. `0.70–0.85`, *"Behavior is consistent with [Tech]"*)
   - `WEAK BEHAVIORAL` ──► `WEAK_SIGNAL` (Confidence: `LOW`, e.g. `< 0.50`)
   - `INSUFFICIENT TELEMETRY` ──► `UNOBSERVED` (Preserved in `knownUnknowns`)
3. **No Phantom Vulnerabilities (H2-009)**: Protocol quirks and wire behavioral markers (e.g., HTTP/2, TLS 1.3, Vercel routing IDs) never synthesize phantom security vulnerability findings.
4. **H1 Topology Feeding (H2-007)**: Behavioral discoveries feed the H1 topology graph as evidence without overwriting H1 truth or creating phantom hops.
5. **Three-Level Progressive Disclosure (H2-008)**:
   - **Level 1**: High-level understanding (Name, Layer, Role, Calibrated Confidence badge).
   - **Level 2**: Why this appears, infrastructure meaning, and strict negative boundaries (`whatThisDoesNotProve`).
   - **Level 3**: Raw wire telemetry indicators, source types, and verification timestamps.

---

## 2. H2 Sub-Specification Architecture

```
                                LIVE DOMAIN
                                     │
                                     ▼
                           HTTP / TLS / Protocol
                                Observations
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
            HTTP Behavior       TLS Behavior       Error Behavior
                 │                   │                   │
                 └───────────────────┼───────────────────┘
                                     │
                                     ▼
                         Deep Behavioral Engine
                                (H2-001–004)
                                     │
                                     ▼
                           Evidence Fusion Engine
                                  (H2-005)
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        Direct + Behavioral                       Behavioral Only
                 │                                       │
                 ▼                                       ▼
           CORROBORATED                              CONSISTENT
         (Confidence: HIGH)                     (Confidence: MEDIUM)
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                                     ▼
                         H1 Ingress Request Path
                                  (H2-007)
                                     │
                                     ▼
                            Adaptive UI Model
                           Level 1 / 2 / 3 (H2-008)
```

### H2-001: HTTP Behavioral Fingerprinting
- **Header Order & Parameterization**: Evaluates Keep-Alive parameters (`timeout=5` Node.js socket defaults), cookie formats (`connect.sid`, `sails.sid`, `fastify.session`), and ETag formatting (Hexadecimal inode-size-time NGINX format).
- **Edge Routing Headers**: Identifies Fastly (`x-served-by`, `fastly-restarts`, `x-fastly-request-id`), Akamai (`x-akamai-transformed`, `akamai-grn`, `x-check-cacheable`), Vercel (`x-vercel-id`, `x-vercel-cache`), and Netlify (`x-nf-request-id`).
- **Ingress Gateway Headers**: Traefik (`x-traefik-router`), HAProxy (`x-haproxy-id`), Caddy (`caddy-restarts`).

### H2-002: HTTP/2 Behavioral Signals
- **Protocol Quirk Signatures**: Negotiated pseudo-headers (`:status`), `x-http2`, and multiplexed transport characteristics captured safely as protocol telemetry.

### H2-003: TLS Behavioral Fingerprinting
- **Handshake Characteristics**: Negotiated TLS protocol version (`TLSv1.3`, `TLSv1.2`) and cipher suites (`TLS_AES_256_GCM_SHA384`).
- **Certificate Authority Profiles**: Evaluates Let's Encrypt / ISRG Root profiles and Cloudflare Origin/Edge CA chains without cloud provider overreach.

### H2-004: Error Behavior Fingerprinting
- **Structural Error Templates**: NGINX centered layout (`<center><h1>Error</h1></center>`), Express router unmatched path templates (`<pre>Cannot GET /route</pre>`), and Traefik 404 router messages.

### H2-005: Evidence Correlation Engine
- **`EvidenceFusionEngine`**: Fuses direct detections with 34 evaluated behavioral signatures across 4 analyzers.
- Corroborates direct observations up to `0.98` confidence; outputs non-dogmatic claims for behavioral-only findings.

### H2-006: Anti-False-Positive Boundary
- Avoids dogmatic leaps (e.g., TLS Let's Encrypt does not imply AWS/GCP/Cloudflare; HTTP/2 does not imply Envoy).
- General protocol wire telemetry without target technologies does not manufacture phantom technologies.

### H2-007: Integration with H1 Topology Understanding
- Feeds verified behavioral findings into linear Ingress Request Path hops (`Hop 0: Client Ingress ──► Hop 1: EDGE ──► Hop 2: GATEWAY ──► Hop 3: RUNTIME ──► Sealed Core`).

### H2-008: Progressive Disclosure Mapping
- DTO and UI contract projection preserving Level 1 (Understanding), Level 2 (Why + Boundaries), and Level 3 (Wire Evidence).

### H2-009: Findings Boundary
- Zero phantom security findings generated from behavioral signals or protocol parameters alone.

---

## 3. Test Suite Verification Matrix

| Test Suite | Spec File | Tests Passed | Status |
|:---|:---|:---|:---|
| **H2 Backend Vertical Integration** | `apps/api/src/modules/understanding/h2-deep-behavioral-fingerprinting.spec.ts` | **12 / 12** | 🟢 PASS |
| **Deep Behavioral Engine Unit** | `apps/api/src/infrastructure/discovery/technology/engine/deep-behavioral-fingerprinting.engine.spec.ts` | **33 / 33** | 🟢 PASS |
| **Technology Fingerprinting Integration** | `apps/api/src/modules/understanding/technology-fingerprinting.integration.spec.ts` | **3 / 3** | 🟢 PASS |
| **H2 Frontend Intelligence & Disclosure** | `apps/web/src/features/workspace/workspace-h2-behavioral-fingerprinting.spec.ts` | **5 / 5** | 🟢 PASS |
| **H1 Ingress Topology Backend** | `apps/api/src/modules/understanding/h1-ingress-path-and-topology.spec.ts` | **8 / 8** | 🟢 PASS |
| **H1 Ingress Topology Frontend** | `apps/web/src/features/workspace/workspace-h1-ingress-path-topology.spec.ts` | **5 / 5** | 🟢 PASS |
| **Full API Regression Suite** | `pnpm --filter api test` | **159 suites / 1,077 tests** | 🟢 PASS (0 failures) |
| **Full Web Regression Suite** | `pnpm --filter web test` | **807 suites / 1,185 tests** | 🟢 PASS (0 failures) |
| **Full Production Build** | `pnpm build` | **api + web (2 packages)** | 🟢 PASS (0 errors) |
