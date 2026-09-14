# Infrastructure Snapshot Memory & Temporal Baseline Architecture

**Document Type:** Architectural Reference & Domain Intelligence Guide  
**Status:** Implemented (TECH-005)  
**Priority:** P0 — Temporal Baseline Foundation  
**Module:** `apps/api/src/modules/understanding`  
**Depends On:** TECH-004 🔒 (Architecture Brief Synthesis) · TECH-QA-001 🔒 (End-to-End Intelligence Certification)  

---

## 1. Executive Overview & Philosophy

The foundational question answered by **TECH-005** is:

> **"What did this infrastructure look like before?"**

TECH-005 establishes Nebula's **temporal baseline memory**. It transforms point-in-time understanding outputs into **immutable historical snapshots** that serve as the authoritative reference points for future Change Intelligence (TECH-006+).

```
Understanding Run (TECH-001 → TECH-004)
        ↓
Structured Infrastructure Understanding
        ↓
Canonicalization & Deterministic Fingerprinting (TECH-005)
        ↓
Immutable Snapshot Memory
 ├── Current Snapshot (Aug 27)
 ├── Previous Snapshot (Aug 26)
 └── Historical Baselines (Aug 25, Aug 21...)
        ↓
Future Differential Change Detection (TECH-006+)
```

---

## 2. Core Architecture & Contracts

Contracts reside in [`apps/api/src/modules/understanding/contracts/snapshot-memory.interface.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/understanding/contracts/snapshot-memory.interface.ts):

### 2.1 InfrastructureSnapshotMemory Contract

```typescript
export interface InfrastructureSnapshotMemory {
  readonly snapshotId: string;
  readonly domainId: string;
  readonly domainName: string;

  readonly observedAt: string;       // Timestamp when network observations occurred
  readonly createdAt: string;        // Timestamp when snapshot was persisted
  readonly snapshotVersion: string;  // Understanding contract version (e.g. "2.0.0")

  readonly technologies: DetectedTechnology[];
  readonly topology: InfrastructureTopology;
  readonly architectureBrief: InfrastructureArchitectureBrief;

  readonly fingerprints: SnapshotFingerprints;
}
```

### 2.2 Deterministic Cryptographic Fingerprints

```typescript
export interface SnapshotFingerprints {
  readonly technologyFingerprint: string;     // SHA-256 hash of canonicalized technologies
  readonly topologyFingerprint: string;       // SHA-256 hash of canonicalized topology nodes/edges
  readonly architectureFingerprint: string;   // SHA-256 hash of canonicalized path, layers, unknowns
  readonly evidenceFingerprint: string;       // SHA-256 hash of canonicalized raw discovery telemetry
  readonly overallFingerprint: string;        // Composite SHA-256 hash for O(1) equality check
}
```

---

## 3. Key Invariants & Principles

### 3.1 Hard Immutability
Once an Understanding Snapshot is finalized and persisted, **it is never mutated**. If an infrastructure stack changes tomorrow (e.g. Sentry APM is attached), today's snapshot remains completely unchanged. This guarantees repeatable, trustworthy historical audits.

### 3.2 Observation Time vs Creation Time vs Version
- **`observedAt`**: Time when HTTP, DNS, and TLS responses were received from the public network.
- **`createdAt`**: Time when Nebula completed analysis and persisted the snapshot record in PostgreSQL.
- **`snapshotVersion`**: The semantic contract version (`2.0.0`) that produced the understanding model.

### 3.3 Semantic Comparison (Never Compare Presentation Strings)
Future change detection compares **canonical structured data** rather than presentation summary strings (`old.summary !== new.summary`). This prevents superficial phrasing differences from triggering false changes.

### 3.4 Preservation of Unknowns and Claim Boundaries
Uncertainty is preserved as a first-class property in memory:
- If a domain had `Origin Cloud Provider: MASKED` on Day 1, this state is permanently recorded.
- If it remains `MASKED` on Day 2, no change is flagged.
- If it reveals `AWS EC2` on Day 3, a true infrastructure change is detected.

---

## 4. Services Architecture

1. **[`SnapshotCanonicalizerService`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/understanding/services/snapshot-canonicalizer.service.ts)**: Normalizes and deterministically sorts technology objects, topology graph edges, architecture paths, layers, and raw observations.
2. **[`SnapshotFingerprintService`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/understanding/services/snapshot-fingerprint.service.ts)**: Computes deterministic SHA-256 hashes across technology, topology, architecture, and evidence layers.
3. **[`SnapshotMemoryService`](file:///home/swasthik-k-j/Desktop/Atlas/apps/api/src/modules/understanding/services/snapshot-memory.service.ts)**: Synthesizes snapshot memories, evaluates baseline comparisons (`compareBaselines`), and provides secure point-in-time and historical lookups.

---

## 5. Milestone Progression

```
TECH-001 🔒: What exists? (Detection)
       ↓
TECH-002 🔒: What does it mean? (Meaning & Roles)
       ↓
TECH-003 🔒: How does it relate? (Topology Graph)
       ↓
TECH-004 🔒: What does the infrastructure look like as a whole? (Synthesis Brief)
       ↓
TECH-QA-001 🔒: Certified End-to-End Intelligence Pipeline
       ↓
TECH-005 🔒: What did it look like before? (Snapshot Memory & Baseline)
       ↓
TECH-006: What changed? (Semantic Change Intelligence Engine)
       ↓
TECH-007: Why does the change matter? (Architectural Evolution & Drift)
```
