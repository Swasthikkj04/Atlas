# Owner Decision Register

**Project**: Nebula Intelligence Platform (under Argonion)  
**Document Purpose**: Authoritative tracking of key architectural, domain, infrastructure, and operational decisions requiring formal Product Owner sign-off before production cloud deployment.  
**Status**: **ALL DECISIONS APPROVED (8 / 8 APPROVED)** — Gates Closed via PROD-001  
**Last Updated**: 2026-09-12  

---

## Decision Matrix Summary

| # | Decision Topic | Approved Option | Status | Owner Approval Required |
|---|---|---|---|---|
| **OD-01** | Canonical Nebula Domain Routing | **APPROVED**: Multi-surface routing (`argonion.com`, `app`, `nebula`, `api`) per [ADR-PROD-001](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md) | **APPROVED** | **COMPLETED** |
| **OD-02** | Inbound Email Routing & Aliases | **APPROVED**: Cloudflare Email Routing (`security@`, `support@`, `hello@argonion.com` to verified destination inbox) per [ADR-PROD-006](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md) | **APPROVED** | **COMPLETED** |
| **OD-03** | Outbound Email Identity | **APPROVED**: Resend transactional sending (`From: Swasthik K J <swasthik@argonion.com>`, `Reply-To: support@argonion.com`, `no-reply@argonion.com`) per [ADR-PROD-003](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md) | **APPROVED** | **COMPLETED** |
| **OD-04** | Google Cloud Production Region | **APPROVED**: `asia-south1` (Mumbai, India) per [ADR-PROD-004](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md) | **APPROVED** | **COMPLETED** |
| **OD-05** | Cloud SQL Initial Sizing & Availability | **APPROVED**: Tier 2 (`db-custom-1-3840`, 1 vCPU, 3.75GB RAM, `ZONAL`) per [ADR-PROD-002](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md) | **APPROVED** | **COMPLETED** |
| **OD-06** | GCP Project & Billing Ownership | **APPROVED**: Project `argonion-nebula-prod`, Owner Swasthik K J (`swasthik@argonion.com`), $250 budget alert | **APPROVED** | **COMPLETED** |
| **OD-07** | OAuth Production Ownership | **APPROVED**: Google & GitHub OAuth apps owned by Swasthik K J, canonical callbacks `https://api.argonion.com/api/v1/auth/*` | **APPROVED** | **COMPLETED** |
| **OD-08** | Production Launch Approval Authority | **APPROVED**: Launch & Rollback Approver: Swasthik K J (Product Owner / Lead Engineer) | **APPROVED** | **COMPLETED** |

---

## Detailed Decision Records

### OD-01: Canonical Nebula Domain Routing
* **Decision**: Determine the production domain and subdomain routing topology for the landing page, guest sandbox, authenticated workspace, and backend API.
* **Status**: **APPROVED BY PRODUCT OWNER** (2026-09-12)
* **Approved Routing Architecture**:

| Domain / Subdomain | Target Surface / Experience | Hosting Target |
| :--- | :--- | :--- |
| **`argonion.com`** | **Argonion / Nebula Landing Page** | Google Cloud Run (`nebula-prod-web` - Root Landing) |
| **`www.argonion.com`** | **Canonical Permanent Redirect** | Cloudflare 301 Redirect to `https://argonion.com` |
| **`app.argonion.com`** | **Nebula Guest Experience (GX)** | Google Cloud Run (`nebula-prod-web` - GX Sandbox) |
| **`nebula.argonion.com`** | **Nebula Workspace (WX)** | Google Cloud Run (`nebula-prod-web` - Authenticated WX) |
| **`api.argonion.com`** | **Nebula NestJS Backend API** | Google Cloud Run (`nebula-prod-api`) |

* **Governing Decision Record**: [ADR-PROD-001-DOMAIN-ROUTING.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-001-DOMAIN-ROUTING.md)
* **Owner Approval**: **COMPLETED**

---

### OD-02: Inbound Email Routing
* **Decision**: Define the inbound email routing architecture and forwarding aliases for `@argonion.com`.
* **Status**: **APPROVED BY PRODUCT OWNER** (2026-09-12)
* **Approved Routing**:
  * `security@argonion.com` → Verified owner destination inbox
  * `support@argonion.com` → Verified owner destination inbox
  * `hello@argonion.com` → Verified owner destination inbox
* **Security Invariant**: The private destination inbox address is never placed in public documentation, source code, Terraform, frontend environment variables, or GitHub.
* **Governing Decision Record**: [ADR-PROD-006-SUPPORT-CONTACT.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-006-SUPPORT-CONTACT.md)
* **Owner Approval**: **COMPLETED**

---

### OD-03: Outbound Email Identity & Resend Senders
* **Decision**: Define the outbound transactional email provider, sender identities, and Reply-To routes.
* **Status**: **APPROVED BY PRODUCT OWNER** (2026-09-12)
* **Approved Configuration**:
  * **Provider**: Resend API (`EMAIL-001` → `EMAIL-010`)
  * **Personal Welcome Email**: `Swasthik K J <swasthik@argonion.com>` (`AUTH-EMAIL-001`)
  * **System / Transactional Email**: `Nebula <no-reply@argonion.com>` (Verification, Password Reset)
  * **Reply-To**: `support@argonion.com`
* **Governing Decision Record**: [ADR-PROD-003-EMAIL-ROUTING.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-003-EMAIL-ROUTING.md)
* **Owner Approval**: **COMPLETED**

---

### OD-04: Google Cloud Production Region
* **Decision**: Select the primary Google Cloud region for Cloud Run, Cloud SQL, and Secret Manager.
* **Status**: **APPROVED: `asia-south1` (Mumbai, India)** (2026-09-12)
* **Verification Summary**:
  * Cloud Run Gen2: Verified supported in `asia-south1`.
  * Cloud SQL PostgreSQL 17: Verified supported in `asia-south1`.
  * Serverless VPC Access: Verified supported in `asia-south1` (`10.8.0.0/28`).
  * Latency: Delivers 15–35ms round-trip latency to South Asian and Indian users (vs 200–250ms for `us-central1`).
* **Governing Decision Record**: [ADR-PROD-004-DEPLOYMENT-REGION.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md)
* **Owner Approval**: **COMPLETED**

---

### OD-05: Cloud SQL Initial Sizing & Availability
* **Decision**: Select the initial database tier, storage sizing, and multi-zone availability mode.
* **Status**: **APPROVED: Tier 2 (`db-custom-1-3840`, `ZONAL`)** (2026-09-12)
* **Approved Specifications**:
  * **Machine Tier**: `db-custom-1-3840` (1 vCPU, 3.75 GB RAM)
  * **Storage**: 10 GB SSD with automatic storage increases enabled
  * **Availability**: `ZONAL` (Single-zone to conserve $300 Free Trial runway; HA deferred)
  * **Backups**: Daily automated backup at `02:00 UTC` + 7-day Point-in-Time Recovery (PITR)
  * **Monthly Baseline**: ~$45.00 – $55.00 / month
  * **Budget Guard**: $250 threshold alert configured with email alerts to owner
* **Governing Decision Record**: [ADR-PROD-002-CLOUDSQL-SIZING.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md)
* **Owner Approval**: **COMPLETED**

---

### OD-06: GCP Project & Billing Ownership
* **Decision**: Designate the owner identity, project ID, and budget governance for Google Cloud.
* **Status**: **APPROVED BY PRODUCT OWNER** (2026-09-12)
* **Approved Ownership**:
  * **Project ID**: `argonion-nebula-prod`
  * **Project Name**: `Argonion Nebula Production`
  * **Billing Account Owner**: Swasthik K J (`swasthik@argonion.com`)
  * **Budget Alert Recipient**: `swasthik@argonion.com` ($250 threshold at 50%, 80%, 100%)
  * **Emergency Shutdown Authority**: Swasthik K J
* **Owner Approval**: **COMPLETED**

---

### OD-07: OAuth Production Ownership
* **Decision**: Establish ownership, consent screen configuration, and production redirect URIs for Google and GitHub OAuth.
* **Status**: **APPROVED BY PRODUCT OWNER** (2026-09-12)
* **Approved Details**:
  * **Google Cloud Console Owner**: Swasthik K J
  * **GitHub Developer Settings Owner**: Swasthik K J
  * **Google Redirect URI**: `https://api.argonion.com/api/v1/auth/google/callback`
  * **GitHub Redirect URI**: `https://api.argonion.com/api/v1/auth/github/callback`
  * **Secret Storage**: Google Secret Manager (`nebula-google-client-secret`, `nebula-github-client-secret`)
* **Governing Plan**: [OAUTH-PRODUCTION-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OAUTH-PRODUCTION-PLAN.md)
* **Owner Approval**: **COMPLETED**

---

### OD-08: Production Launch Approval Authority
* **Decision**: Confirm the authorized identity with sole authority to approve public launch, emergency rollbacks, and incident escalation.
* **Status**: **APPROVED BY PRODUCT OWNER** (2026-09-12)
* **Approved Governance**:
  * **Production Launch Approver**: Swasthik K J (Product Owner / Lead Engineer)
  * **Rollback Approver**: Swasthik K J
  * **Security Incident Contact**: `security@argonion.com`
  * **Support Contact**: `support@argonion.com`
  * **Production Verification Owner**: Swasthik K J
* **Owner Approval**: **COMPLETED**
