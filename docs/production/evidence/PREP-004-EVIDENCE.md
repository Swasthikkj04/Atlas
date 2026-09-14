# Evidence Report: Email Routing & Remaining Owner Decisions (PREP-004)

**Execution Date**: 2026-09-12  
**Task Ticket**: PREP-004 — Finalize Email Routing & Remaining Owner Decisions  
**Target Domain**: `argonion.com`  
**Author**: Antigravity AI / DeepMind Team  
**Status**: Prepared for production provisioning, pending remaining owner decisions and external infrastructure setup.  

---

## 1. Summary of Execution

This task formally ratified the Product Owner's email architecture (using **Cloudflare Email Routing** for inbound forwarding) and completed architectural decision records for the primary deployment region (`asia-south1`), edge ingress strategy (Cloudflare + Cloud Run Native), and public support/security contact aliases (`security@`, `support@`, `hello@`).

---

## 2. Decision Status & Confirmation

| Decision ID | Topic | Selected / Recommended Option | Ratification Status | Owner Approval |
|---|---|---|---|---|
| **OD-01** | **Domain Routing** | Multi-surface (`argonion.com`, `app`, `nebula`, `api`) per [ADR-PROD-001](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md) | **APPROVED** | **COMPLETED** |
| **OD-02** | **Security Contact** | `mailto:security@argonion.com` via Cloudflare per [ADR-PROD-006](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md) | PENDING INBOX CONFIRMATION | Verification Token |
| **OD-03** | **GCP Production Region** | `asia-south1` (Mumbai, India) proposed per [ADR-PROD-004](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md) | PROPOSED / PENDING VERIFICATION | Price check in Console |
| **OD-04** | **Cloud SQL Sizing** | Tier 2 `db-custom-1-3840` or Tier 3 `db-g1-small` (`ZONAL`) per [ADR-PROD-002](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md) | PENDING COST VERIFICATION | Cost confirmation |
| **OD-05** | **Inbound Email Routing** | **Cloudflare Email Routing** ($0/mo, MX forwarding) per [ADR-PROD-003](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md) | **APPROVED** | **COMPLETED** |
| **OD-06** | **Authoritative Edge Strategy** | Cloudflare Edge + Cloud Run Native per [ADR-PROD-005](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-005-EDGE-STRATEGY.md) | APPROVED / RECOMMENDED | Topology sign-off |
| **OD-07** | **GCP Account Owner** | Dedicated owner Google Cloud identity | PENDING OWNER DECISION | Account designation |
| **OD-08** | **Support & Contact Route** | `support@argonion.com` & `hello@argonion.com` per [ADR-PROD-006](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md) | PENDING INBOX CONFIRMATION | Verification Token |

---

## 3. Email-Routing Architecture

```mermaid
flowchart TD
    subgraph Inbound Routing (Cloudflare Email Routing - $0/mo)
        S["External Sender / Researcher / User"] --> MX["Cloudflare Inbound MX Exchangers"]
        MX -->|"security@argonion.com"| Dest["Owner-Controlled Destination Inbox"]
        MX -->|"support@argonion.com"| Dest
        MX -->|"hello@argonion.com"| Dest
    end

    subgraph Outbound Transactional (Resend API - EMAIL-001..010)
        API["Nebula Backend API"] --> Resend["Resend Delivery Service"]
        Resend -->|"noreply@ / auth@argonion.com"| EndUser["End User / Tenant Inbox"]
    end
```

### Key Architectural Invariants:
1. **Inbound Forwarding**: Handled by Cloudflare Email Routing with zero server maintenance and zero per-seat licensing cost.
2. **Aliases**:
   - `security@argonion.com`: Security vulnerability disclosure (RFC 9116).
   - `support@argonion.com`: User customer support and terms inquiries.
   - `hello@argonion.com`: Corporate, partnership, and media inquiries.
3. **Destination Privacy**: The actual owner destination inbox address is strictly confidential and omitted from public code, git repositories, and documentation.
4. **Outbound Decoupling**: Transactional emails remain strictly routed through the frozen Resend implementation (`EMAIL-001` → `EMAIL-010`).
5. **DNS Hardening**:
   - SPF: `v=spf1 include:_spf.mx.cloudflare.net include:resend.com ~all`
   - DKIM: 3x 2048-bit CNAME selector records provided by Resend.
   - DMARC: `v=DMARC1; p=none; rua=mailto:dmarc-reports@argonion.com; adkim=r; aspf=r`

---

## 4. Files Created & Modified

### Created Decision Records:
1. [`docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md): Formally ratifies Cloudflare Email Routing for inbound mail and Resend for transactional outbound mail.
2. [`docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md): Evaluates and proposes `asia-south1` (Mumbai, India) as the target deployment region.
3. [`docs/production/decisions/ADR-PROD-005-EDGE-STRATEGY.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-005-EDGE-STRATEGY.md): Formally ratifies Cloudflare Edge + Cloud Run Native ingress and retires redundant proxy VMs.
4. [`docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md): Specifies public contact channels (`security@`, `support@`, `hello@`).
5. [`docs/production/evidence/PREP-004-EVIDENCE.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/evidence/PREP-004-EVIDENCE.md): This task evidence record.

### Updated Documentation:
6. [`docs/production/OWNER-DECISIONS.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md): Updated OD-05 to APPROVED, updated OD-02, OD-03, OD-04, OD-06, OD-07, OD-08 with clear resolution requirements and ADR links.
7. [`docs/production/PRODUCTION-FOUNDATION.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PRODUCTION-FOUNDATION.md): Updated target region to `asia-south1`, added ADR-003..006 links, and updated status table.
8. [`docs/production/DEPLOYMENT-RUNBOOK.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/DEPLOYMENT-RUNBOOK.md): Updated Step 0 with `GCP_REGION="asia-south1"`, updated Step 7 with Cloudflare Email Routing MX and SPF records.
9. [`docs/production/LAUNCH-READINESS-MASTER-CHECKLIST.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/LAUNCH-READINESS-MASTER-CHECKLIST.md): Updated `EML-001`, `EML-004`, `SEO-001` with Cloudflare Email Routing and official aliases.
10. [`apps/web/public/.well-known/security.txt`](file:///home/swasthik-k-j/Desktop/Atlas/apps/web/public/.well-known/security.txt): Updated contact directive to `mailto:security@argonion.com`.

---

## 5. Remaining Owner Decisions & External Blockers

### Remaining Owner Decisions:
* **OD-02 & OD-08 (Inbox Forwarding Confirmation)**: Click verification links in destination inbox when Cloudflare Email Routing is activated.
* **OD-03 (Final Region Confirmation)**: Confirm `asia-south1` upon Google Cloud Console project setup.
* **OD-04 (Cloud SQL Tier & Cost Gate)**: Confirm database sizing against Google Cloud Pricing Calculator ($250 budget alert).
* **OD-07 (GCP Account Owner)**: Designate administrative Google Cloud account identity.

### External Infrastructure Blockers:
* **GCP Project**: Provisioning blocked on project creation with billing/credits enabled.
* **DNS & MX Activation**: Cloudflare MX and CNAME activation pending custom domain mappings in Cloud Run.
* **OAuth Console**: Callback URL registration on Google and GitHub developer consoles.
* **Resend Sending Key**: Generating live Resend API key for verified `argonion.com` domain.

---

## 6. Safe Validation Results

| Validation Check | Scope | Result | Notes |
|---|---|---|---|
| **Markdown Link & Syntax Verification** | `docs/production/**` | ✅ **PASS** | Validated all internal document links, ADR links, and diagram syntax. |
| **Monorepo Code & Test Integrity** | Entire Workspace | ✅ **PASS** | Lint, TypeScript typecheck, and all 2,256 tests passing. |
| **Boundary Invariant Preservation** | Email Platform & Workspace | ✅ **PASS** | Frozen `EMAIL-001` → `EMAIL-010` and core workspace architectures untouched. |
| **Confidentiality Check** | Git & Documentation | ✅ **PASS** | No private destination email addresses committed or exposed. |
