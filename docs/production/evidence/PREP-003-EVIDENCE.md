# Evidence Report: Approved Domain Routing Finalization (PREP-003)

**Execution Date**: 2026-09-12  
**Task Ticket**: PREP-003 — Finalize Approved Domain Routing Decision  
**Target Domain**: `argonion.com`  
**Author**: Antigravity AI / DeepMind Team  
**Status**: Prepared for production provisioning, pending remaining owner decisions and external infrastructure setup.  

---

## 1. Summary of Execution

This task formally ratified and recorded the Product Owner's approved multi-surface domain routing architecture across the entire production documentation suite. Decision **OD-01** has been marked as **APPROVED**, and all unresolved domain routing status flags have been removed.

---

## 2. Exact Final Domain Routing

| Domain / Subdomain | Target Surface / Experience | Hosting & Ingress Target | Purpose & Functionality |
|---|---|---|---|
| **`argonion.com`** | **Argonion / Nebula Landing Page** | Google Cloud Run (`nebula-prod-web` - Root Landing) | Canonical apex domain serving product marketing, brand overview, documentation, legal policies (`/privacy`, `/terms`), and `/.well-known/security.txt`. |
| **`www.argonion.com`** | **Canonical Permanent Redirect** | Cloudflare 301 Redirect | Forces traffic permanently to canonical apex root (`https://argonion.com`). |
| **`app.argonion.com`** | **Nebula Guest Experience (GX)** | Google Cloud Run (`nebula-prod-web` - GX Sandbox) | Friction-free, unauthenticated single-domain intelligence sandbox for prospective users. |
| **`nebula.argonion.com`** | **Nebula Workspace (WX)** | Google Cloud Run (`nebula-prod-web` - Authenticated WX) | Authenticated multi-tenant SaaS workspace for teams, multi-domain inventory, deep findings, memory graph, and forensic analytics. |
| **`api.argonion.com`** | **Nebula NestJS Backend API** | Google Cloud Run (`nebula-prod-api`) | Core authoritative REST/JSON API engine serving both GX and WX operations, auth sessions, and PostgreSQL persistence. |

---

## 3. Files Created & Modified

### Decision Records & Registers:
1. `docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md`:
   - Updated status to **APPROVED BY PRODUCT OWNER**.
   - Documented exact 5-surface routing topology.
   - Documented architectural separation between Guest Experience (GX) and Workspace (WX).
   - Specified CORS origin whitelist and OAuth redirect URIs.
2. `docs/production/OWNER-DECISIONS.md`:
   - Marked **OD-01: Canonical Nebula Domain Routing** as **APPROVED**.
   - Updated summary matrix and detailed record with the approved routing table.
3. `docs/production/evidence/PREP-003-EVIDENCE.md`:
   - This task execution report.

### Dependent Production Documentation:
4. `docs/production/PRODUCTION-FOUNDATION.md`:
   - Updated target domain header, multi-surface topology diagram, and status classification table.
5. `docs/production/DEPLOYMENT-RUNBOOK.md`:
   - Updated Step 0 environment variables (`ROOT_DOMAIN`, `GX_DOMAIN`, `WX_DOMAIN`, `API_DOMAIN`, `CORS_ALLOWED_ORIGINS`).
   - Updated Step 7 Cloud Run custom domain mappings and Cloudflare DNS records.
   - Updated Step 8 multi-surface smoke verification commands.
6. `docs/production/LAUNCH-READINESS-MASTER-CHECKLIST.md`:
   - Updated domain header and cross-references to approved ADR-PROD-001.
   - Updated monitoring probe notes (`MON-003`) and redirect notes (`SEO-007`).
7. `docs/production/PRODUCTION-VERIFICATION.md`:
   - Updated verification test commands to validate health and security headers across `argonion.com`, `app.argonion.com`, `nebula.argonion.com`, and `api.argonion.com`.

---

## 4. Confirmation of Decision Statuses

* **OD-01 (Domain Routing)**: **APPROVED BY PRODUCT OWNER** (Completed)
* **OD-02 (Security Disclosure Email)**: PENDING OWNER DECISION (`security-placeholder@argonion.com` → confirmed contact)
* **OD-03 (GCP Production Region)**: PENDING OWNER DECISION (`us-central1` recommended)
* **OD-04 (Cloud SQL Sizing & Availability)**: PENDING COST VERIFICATION (Tier 2 `db-custom-1-3840` or Tier 3 `db-g1-small` Zonal per ADR-PROD-002)
* **OD-05 (Corporate Mail Provider)**: PENDING OWNER DECISION (Google Workspace / ProtonMail for MX records)
* **OD-06 (Authoritative Edge Strategy)**: PENDING OWNER DECISION (Cloudflare + Cloud Run Native recommended)
* **OD-07 (GCP Project & Billing Owner)**: PENDING OWNER DECISION (Dedicated owner account)
* **OD-08 (Production Support Route)**: PENDING OWNER DECISION (`support@argonion.com` / `/contact`)

---

## 5. Remaining External Blockers

1. **Google Cloud Project**: A live GCP project (e.g. `argonion-nebula-prod`) must be created with billing/credits enabled.
2. **Cloudflare DNS Records**: DNS CNAME records for `@`, `app`, `nebula`, `api`, and MX/SPF/DKIM/DMARC TXT records require Cloudflare dashboard execution once Cloud Run mappings are generated.
3. **OAuth Provider Registration**: Production callback URLs (`https://api.argonion.com/api/v1/auth/google/callback` and `https://api.argonion.com/api/v1/auth/github/callback`) must be registered in Google Cloud Console and GitHub Developer Settings.
4. **Resend API Key**: Resend domain `argonion.com` must be verified and API key populated in Secret Manager.

---

## 6. Safe Validation Checks Performed

| Check | Scope | Result | Details |
|---|---|---|---|
| **Markdown Link & Syntax Audit** | `docs/production/**` | ✅ **PASS** | Validated internal links, ADR references, and mermaid diagrams. |
| **Monorepo Code Verification** | Root / Apps | ✅ **PASS** | Unchanged from PREP-001/PREP-002 baseline (Lint: 0 errors; Typecheck: 0 errors; Unit/Integration tests: 2,256/2,256 passing). |
| **Boundary Invariant Audit** | Email / Workspace | ✅ **PASS** | Frozen boundaries (`EMAIL-001` → `EMAIL-010`, Workspace architecture, Guest Experience) completely untouched. |
