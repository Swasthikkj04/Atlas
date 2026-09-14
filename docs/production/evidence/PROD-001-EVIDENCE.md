# PROD-001 Evidence Record — Close Production Provisioning Gates

**Task**: PROD-001 — Close Production Provisioning Gates  
**Product**: Nebula Intelligence Platform (under Argonion)  
**Date**: 2026-09-12  
**Decider & Owner**: Swasthik K J (Product Owner / Lead Engineer)  
**Status**: **PROD-001 — COMPLETE & VERIFIED 🔒 | Production Provisioning — AUTHORIZED TO BEGIN**  

---

## 1. Readiness Gate Summary Matrix

| Evidence Category | Required Criterion | Verification Finding | Status |
| :--- | :--- | :--- | :--- |
| **Owner Decision Register** | OD-01 through OD-08 resolved | All 8 decisions formally approved and recorded in [`OWNER-DECISIONS.md`](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md). | **CONFIRMED (8/8 APPROVED)** |
| **GCP Billing Ownership** | Named billing owner & budget safeguard | Swasthik K J (`swasthik@argonion.com`) confirmed as billing owner; $250 alert with email notifications at 50%, 80%, 100%. | **CONFIRMED** |
| **Region Verification** | Primary cloud region verified | `asia-south1` (Mumbai) verified for Cloud Run Gen2, Cloud SQL PostgreSQL 17, Serverless VPC Access, and Artifact Registry. | **APPROVED: `asia-south1`** |
| **Cloud SQL Pricing & Sizing** | Source, tier, and date recorded | Tier 2: `db-custom-1-3840` (1 vCPU, 3.75 GB RAM, Zonal) @ ~$45–$55/mo; within $300 trial runway. | **APPROVED: Tier 2 (`db-custom-1-3840`)** |
| **Cloudflare Access & DNS** | Domain zone ownership & edge proxy | Cloudflare zone `argonion.com` confirmed under owner management; nameservers pointed from GoDaddy. | **CONFIRMED** |
| **Inbound Email Routing** | Aliases configured & verified | `security@argonion.com`, `support@argonion.com`, `hello@argonion.com` forward to owner destination inbox via Cloudflare Email Routing. | **CONFIRMED** |
| **Resend Sender Configuration** | Sender identities & SPF/DKIM policy | `Swasthik K J <swasthik@argonion.com>` (Welcome) & `Nebula <no-reply@argonion.com>` (System); Reply-To `support@argonion.com`. Exact Resend DNS records confirmed. | **CONFIRMED** |
| **OAuth Application Ownership** | Google & GitHub app owners & callbacks | Google Cloud Console and GitHub Developer Settings owned by Swasthik K J; canonical callbacks `https://api.argonion.com/api/v1/auth/*`. | **CONFIRMED** |
| **Launch & Rollback Authority** | Authorized sign-off identity | Swasthik K J (Product Owner / Lead Engineer) designated as sole launch and emergency rollback approver. | **CONFIRMED** |
| **Safety & Boundary Non-Interference** | Zero live resources / zero unverified changes | Zero live GCP infrastructure created, zero live secrets exposed, zero DNS modified, zero application code altered. | **VERIFIED (100% INTACT)** |

---

## 2. Regional & Cloud SQL Pricing Verification Evidence

```text
Provider:                       Google Cloud Platform
Target Region:                  asia-south1 (Mumbai, India)
Alternative Region Evaluated:   us-central1 (Iowa, USA)
Checked Date:                   2026-09-12

Service Availability Findings in asia-south1:
- Cloud Run Gen2:               AVAILABLE (Supported Tier 1 Region)
- Cloud SQL PostgreSQL 17:      AVAILABLE (Supported on db-custom-1-3840)
- Serverless VPC Access:        AVAILABLE (/28 subnet supported)
- Artifact Registry:            AVAILABLE (Regional Docker repository)
- Secret Manager:               AVAILABLE (Automatic replication)

Pricing Breakdown (asia-south1 Baseline):
- Cloud SQL (db-custom-1-3840): ~$48.00 / month (1 vCPU, 3.75 GB RAM)
- Cloud SQL Storage (10 GB SSD):~$1.70 / month ($0.170/GB-month)
- Cloud SQL Backups (7-day PITR):~$2.00 / month
- Serverless VPC Access (f1-micro): ~$8.00 / month (1 connector instance)
- Cloud Run Services (Web/API/Worker): ~$0.00 – $5.00 / month (Scale to 0 during idle)
- Cloudflare Email Routing & DNS: $0.00 / month
- Resend Free Tier (100 msgs/day):$0.00 / month
--------------------------------------------------------------------------------
Total Estimated Monthly Baseline: ~$59.70 – $65.00 / month

Budget Runway Analysis:
- Total Free Trial Credits:     $300.00 USD
- Estimated Monthly Burn:       ~$60.00 USD
- Estimated Runway:             ~4.5 to 5.0 months
- Hard Safety Alert Threshold:  $250.00 USD (at 50%, 80%, 100%)

Decision: APPROVED: asia-south1 with Cloud SQL Tier 2 (db-custom-1-3840, ZONAL)
```

---

## 3. Owner Decisions Sign-Off Register (OD-01 to OD-08)

| Decision ID | Summary | Approved Specification |
| :--- | :--- | :--- |
| **OD-01** | Canonical Domain Routing | `argonion.com` (Landing), `www.argonion.com` (301 Redirect), `app.argonion.com` (GX), `nebula.argonion.com` (WX/Auth), `api.argonion.com` (API) |
| **OD-02** | Inbound Email Routing | Cloudflare Email Routing: `security@`, `support@`, `hello@argonion.com` forwarding to owner-controlled destination inbox |
| **OD-03** | Outbound Email Identity | Resend API: `Swasthik K J <swasthik@argonion.com>` (Welcome), `Nebula <no-reply@argonion.com>` (System), `support@argonion.com` (Reply-To) |
| **OD-04** | GCP Production Region | `asia-south1` (Mumbai, India) |
| **OD-05** | Cloud SQL Initial Sizing | Tier 2: `db-custom-1-3840` (1 vCPU, 3.75 GB RAM, 10 GB SSD auto-resize, 7-day PITR, `ZONAL`) |
| **OD-06** | GCP Project & Billing | Project ID: `argonion-nebula-prod`, Owner: Swasthik K J (`swasthik@argonion.com`), $250 Budget Alert |
| **OD-07** | OAuth Production Ownership | Google & GitHub OAuth Apps owned by Swasthik K J; canonical callbacks `https://api.argonion.com/api/v1/auth/{google,github}/callback` |
| **OD-08** | Production Launch Approval | Sole Approver: Swasthik K J (Product Owner / Lead Engineer); Rollback Approver: Swasthik K J |

---

## 4. External Infrastructure Non-Interference Confirmation

* **Zero GCP Resources Created**: No Google Cloud project, billing link, VPC connector, Cloud SQL instance, or Cloud Run service was created during this gate review.
* **Zero DNS Changes Applied**: No live DNS record modifications were made to the Cloudflare zone or GoDaddy registrar.
* **Zero Production Credentials Created**: No live Google/GitHub OAuth credentials, production JWT secrets, database passwords, or Resend production API keys were generated or committed.
* **Zero Application Code Changes**: Application code, database schema (`schema.prisma`), API controllers, email templates, and frontend routes remain 100% frozen and unmodified.
* **Frozen Boundaries Preserved**: Email Platform (`EMAIL-001` → `EMAIL-010` & `AUTH-EMAIL-001`), Workspace architecture, Guest Experience, and domain invariants are fully intact.

---

## 5. Monorepo Validation Results

```text
pnpm test       -> 272 passed / 272 total (2,290 tests passing)
pnpm typecheck  -> 0 errors across all packages (api, web)
pnpm lint       -> 0 errors across all packages (api, web)
```

---

## 6. Gate Determination & Next Phase

```text
================================================================================
FINAL GATE DETERMINATION:
================================================================================
OD-01 through OD-08 Status:     100% APPROVED & SYNCHRONIZED
Regional & Pricing Checks:      VERIFIED & APPROVED (asia-south1 / Tier 2)
External Access & Ownership:    CONFIRMED (Swasthik K J)
Safety Boundaries:              100% PRESERVED (Zero live resource interference)

OVERALL TICKET STATUS:
PROD-001 — COMPLETE & VERIFIED 🔒
Production provisioning — AUTHORIZED TO BEGIN
================================================================================
```
