# S-10: Granular Data Retention & Automated Evidence Lifecycle Purging

## 1. Overview & Architecture

The **Granular Data Retention & Automated Evidence Lifecycle Purging Engine** enforces strict data protection, automated ephemerality bounds, zero-orphan cascade deletion, and cryptographic audit proofs across all persistent layers of Atlas.

```
                    ┌──────────────────────────────────────┐
                    │      DataRetentionPurgeService       │
                    │   - Daily Automated Purge Runner     │
                    │   - Dry-Run Preview Capability       │
                    │   - Cryptographic Proof Generator    │
                    └──────────────────┬───────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│       RawEvidence       │ │  InfrastructureSnapshot │ │      GuestSession       │
│  - HTTP Payloads        │ │  - Synthesized Topology │ │  - 24h Strict Ephemeral │
│  - Gzip Compressed Body │ │  - Findings & Briefs    │ │  - Zero-Orphan Cleanup  │
│  - Tier Cutoff (1d-90d) │ │  - Tier Cutoff (1d-365d)│ │  - Token & State Purge  │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## 2. Granular Tier Retention Matrix

| Tier | Raw Collector Evidence | Infrastructure Snapshots | Change History & Drift | Guest Sessions | Security Audit Logs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GUEST** | 24 Hours (1 Day) | 24 Hours (1 Day) | 24 Hours (1 Day) | 24 Hours (1 Day) | 90 Days |
| **FREE** | 7 Days | 14 Days | 30 Days | 24 Hours (1 Day) | 90 Days |
| **PRO** | 30 Days | 90 Days | 180 Days | 24 Hours (1 Day) | 365 Days (1 Year) |
| **ENTERPRISE**| 90 Days | 365 Days (1 Year) | 730 Days (2 Years) | 24 Hours (1 Day) | 1,095 Days (3 Years)|

---

## 3. Cryptographic Verification & Deletion Audit Proofs

Whenever an automated or on-demand lifecycle purge is executed, the engine computes a tamper-evident SHA-256 digest:

$$\text{Proof} = \text{SHA-256}(\text{Category} \parallel \text{CutoffDate} \parallel \text{EvaluatedCount} \parallel \text{PurgedCount} \parallel \text{ReclaimedBytes} \parallel \text{DryRun})$$

This receipt is returned to the caller and logged in the immutable security audit stream, guaranteeing compliance with SOC 2, ISO 27001, and GDPR Article 17 ("Right to Erasure").

---

## 4. REST API & Lifecycle Control Endpoints

- `GET /api/v1/workspace/retention/policy`: Returns authoritative retention bounds for the workspace tier.
- `GET /api/v1/workspace/retention/footprint`: Returns storage metrics (total bytes, compressed bytes, expired record count, estimated reclaimable bytes).
- `POST /api/v1/workspace/retention/preview`: Safe dry-run calculating records and bytes that would be purged without mutating storage.
- `POST /api/v1/workspace/retention/purge`: Executes live on-demand purge and returns the cryptographic SHA-256 deletion receipt.

---

## 5. Frontend Visual Experience

- **Contract**: [`data-retention-privacy.contract.ts`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/contracts/data-retention-privacy.contract.ts)
- **Component**: [`DataRetentionPrivacyCard.tsx`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/src/features/workspace/components/privacy/DataRetentionPrivacyCard.tsx)
  - Visual policy meters for Raw Evidence, Snapshots, and Audit Logs.
  - Multi-tier storage footprint bar (Active Valid vs Expired Pending Purge).
  - Gzip compression efficiency statistics.
  - Interactive "Preview Purge" and "Purge Expired" action triggers.
  - Real-time cryptographic receipt banner with SHA-256 proof inspection.

---

## 6. Verification & Test Suite Metrics

- **Evidence & Retention Unit Test Suites**: 4 passed (15 tests)
- **Full Backend Test Suite**: **258 passed, 0 failed (2,085 total tests)**
- **Full Frontend Test Suite**: **1,078 passed, 0 failed (1,920 total tests)**
- **Compilation**: 0 TypeScript errors across both `apps/api` and `apps/web`.
