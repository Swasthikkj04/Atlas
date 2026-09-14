# Production Provisioning Master Checklist

**Product**: Nebula Intelligence Platform (under Argonion)  
**Document Status**: **ACTIONABLE CHECKLIST (PHASE 0 GATES CLOSED VIA PROD-001)**  
**Execution Status**: Phase 0 (Owner Decisions & Readiness) **100% COMPLETE & APPROVED**. Ready for Phase 1 live provisioning.  
**Project Owner**: Swasthik K J (`swasthik@argonion.com`)  
**Last Updated**: 2026-09-12  

---

## 1. Phase 0: Owner Decisions Sign-Off Gate (COMPLETED)

| ID | Decision Item | Reference | Assigned Owner | Status | Gate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0.1** | Domain Routing (`argonion.com`, `app`, `nebula`, `api`) | [OD-01](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-01-canonical-nebula-domain-routing) | Swasthik K J | **APPROVED** | **PASS** |
| **0.2** | Inbound Email Routing via Cloudflare | [OD-02](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-02-inbound-email-routing) | Swasthik K J | **APPROVED** | **PASS** |
| **0.3** | Outbound Email Identity & Resend Senders | [OD-03](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-03-outbound-email-identity--resend-senders) | Swasthik K J | **APPROVED** | **PASS** |
| **0.4** | Google Cloud Production Region (`asia-south1`) | [OD-04](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-04-google-cloud-production-region) | Swasthik K J | **APPROVED** | **PASS** |
| **0.5** | Cloud SQL Sizing Tier (Tier 2: `db-custom-1-3840`, `ZONAL`) | [OD-05](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-05-cloud-sql-initial-sizing--availability) | Swasthik K J | **APPROVED** | **PASS** |
| **0.6** | GCP Project ID & Billing Account Ownership | [OD-06](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-06-gcp-project--billing-ownership) | Swasthik K J | **APPROVED** | **PASS** |
| **0.7** | OAuth Production Ownership & Callbacks | [OD-07](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-07-oauth-production-ownership) | Swasthik K J | **APPROVED** | **PASS** |
| **0.8** | Production Launch Approval Authority | [OD-08](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-08-production-launch-approval-authority) | Swasthik K J | **APPROVED** | **PASS** |

---

## 2. Phase 1: GCP Bootstrap & Project Setup

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | Create GCP Project `argonion-nebula-prod` | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#2-project-creation--organization-setup) | [ ] READY | `gcloud projects describe argonion-nebula-prod` |
| **1.2** | Link Billing Account ($300 Free Trial credits) | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#2-project-creation--organization-setup) | [ ] READY | `gcloud billing projects describe argonion-nebula-prod` |
| **1.3** | Configure $250 Budget Alert & Email Notifications | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#3-budget-alert--cost-control-configuration) | [ ] READY | `gcloud billing budgets list` |
| **1.4** | Enable Required APIs (Cloud Run, SQL, Secrets, etc.) | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#4-required-service-api-enablement) | [ ] READY | `gcloud services list --enabled` |
| **1.5** | Confirm Live Region Support for `asia-south1` | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#5-regional-architecture-asia-south1-mumbai-india) | [ ] READY | Confirm Cloud Run, SQL, and VPC connector support |

---

## 3. Phase 2: IAM & Security Hardening

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | Create Service Accounts (`api-sa`, `worker-sa`, etc.) | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#6-service-account--least-privilege-iam-architecture) | [ ] READY | `gcloud iam service-accounts list` |
| **2.2** | Bind Least-Privilege IAM Roles (Zero owner/editor) | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#iam-role-bindings) | [ ] READY | `gcloud projects get-iam-policy argonion-nebula-prod` |
| **2.3** | Apply Project Deletion Lien | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#8-deletion-protection--disaster-recovery-considerations) | [ ] READY | `gcloud resource-manager liens list` |

---

## 4. Phase 3: Networking & VPC Peering

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **3.1** | Create VPC Network & Subnet | [PRODUCTION-FOUNDATION.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PRODUCTION-FOUNDATION.md) | [ ] READY | `gcloud compute networks list` |
| **3.2** | Configure Private Services Access (Service Networking) | [PRODUCTION-FOUNDATION.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PRODUCTION-FOUNDATION.md) | [ ] READY | `gcloud compute addresses list --global` |
| **3.3** | Provision Serverless VPC Access Connector (`10.8.0.0/28`) | [PRODUCTION-FOUNDATION.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PRODUCTION-FOUNDATION.md) | [ ] READY | `gcloud compute networks vpc-access connectors describe` |

---

## 5. Phase 4: Database Provisioning & Migration

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | Provision Cloud SQL PostgreSQL 17 (Private IP Only) | [ADR-PROD-002](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md) | [ ] READY | `gcloud sql instances describe nebula-prod-postgres` |
| **4.2** | Enable Automated Daily Backups & 7-Day PITR | [ADR-PROD-002](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md) | [ ] READY | Confirm backup retention and binary log settings |
| **4.3** | Verify Deletion Protection Enabled | [ADR-PROD-002](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-002-CLOUDSQL-SIZING.md) | [ ] READY | Confirm `deletionProtection = true` |
| **4.4** | Run Prisma Production Migrations (`prisma migrate deploy`)| [DEPLOYMENT-RUNBOOK.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/DEPLOYMENT-RUNBOOK.md) | [ ] READY | Confirm `_prisma_migrations` table applied successfully |

---

## 6. Phase 5: Secret Provisioning (Secret Manager)

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **5.1** | Create Secret Containers in Secret Manager | [SECRET-MANAGEMENT-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/SECRET-MANAGEMENT-PLAN.md#3-secret-provisioning-in-google-secret-manager) | [ ] READY | `gcloud secrets list` |
| **5.2** | Inject High-Entropy Secret Versions (DB, JWT, etc.) | [SECRET-MANAGEMENT-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/SECRET-MANAGEMENT-PLAN.md#3-secret-provisioning-in-google-secret-manager) | [ ] READY | `gcloud secrets versions list SECRET_NAME` |
| **5.3** | Validate Zero Secrets in Git or Frontend Bundles | [SECRET-MANAGEMENT-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/SECRET-MANAGEMENT-PLAN.md#2-anti-leakage-invariants--hardened-boundaries) | [ ] READY | Run secret scan and bundle analyzer check |

---

## 7. Phase 6: Container Build & Artifact Push

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **6.1** | Create Artifact Registry Docker Repository | [GCP-PROJECT-BOOTSTRAP.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/GCP-PROJECT-BOOTSTRAP.md#7-artifact-registry-setup) | [ ] READY | `gcloud artifacts repositories describe nebula-docker-repo` |
| **6.2** | Build & Push Multi-Stage Image for `api` | [DEPLOYMENT-RUNBOOK.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/DEPLOYMENT-RUNBOOK.md) | [ ] READY | Image digest in Artifact Registry |
| **6.3** | Build & Push Multi-Stage Image for `worker` | [DEPLOYMENT-RUNBOOK.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/DEPLOYMENT-RUNBOOK.md) | [ ] READY | Image digest in Artifact Registry |
| **6.4** | Build & Push Multi-Stage Image for `web` | [DEPLOYMENT-RUNBOOK.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/DEPLOYMENT-RUNBOOK.md) | [ ] READY | Image digest in Artifact Registry |

---

## 8. Phase 7: Cloud Run Services Deployment

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **7.1** | Deploy `nebula-prod-api` (Port 8080, VPC, Secrets) | [PROVISIONING-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PROVISIONING-PLAN.md#6-cloud-run-services-topology--configuration) | [ ] READY | `GET /api/v1/health` returns 200 OK |
| **7.2** | Deploy `nebula-prod-worker` (Internal Only, Standalone) | [PROVISIONING-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PROVISIONING-PLAN.md#6-cloud-run-services-topology--configuration) | [ ] READY | Worker polling loop active in Cloud Logging |
| **7.3** | Deploy `nebula-prod-web` (Multi-surface SPA) | [PROVISIONING-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PROVISIONING-PLAN.md#6-cloud-run-services-topology--configuration) | [ ] READY | `GET /healthz` returns 200 OK |

---

## 9. Phase 8: Cloudflare DNS, Custom Domains & SSL

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **8.1** | Configure Pre-Deployment MX Records for Cloudflare Email | [CLOUDFLARE-DNS-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/CLOUDFLARE-DNS-PLAN.md#3-phase-1-pre-deployment-baseline-records) | [ ] READY | `dig MX argonion.com` |
| **8.2** | Configure Baseline DMARC, CAA, and DNSSEC | [CLOUDFLARE-DNS-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/CLOUDFLARE-DNS-PLAN.md#3-phase-1-pre-deployment-baseline-records) | [ ] READY | `dig TXT _dmarc.argonion.com` |
| **8.3** | Map Cloud Run Custom Domains (`argonion.com`, `app`, `nebula`, `api`) | [CLOUDFLARE-DNS-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/CLOUDFLARE-DNS-PLAN.md#5-phase-3-cloud-run-custom-domain-mappings) | [ ] READY | Custom domain certificate verification active |
| **8.4** | Configure Cloudflare CNAME Records (`ghs.googlehosted.com`) | [CLOUDFLARE-DNS-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/CLOUDFLARE-DNS-PLAN.md#5-phase-3-cloud-run-custom-domain-mappings) | [ ] READY | DNS resolution for all 4 endpoints |
| **8.5** | Enable SSL/TLS Full (Strict) & HSTS Preload | [CLOUDFLARE-DNS-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/CLOUDFLARE-DNS-PLAN.md#6-edge-security--performance-settings) | [ ] READY | `curl -I https://argonion.com` returns strict headers |

---

## 10. Phase 9: External Integrations (OAuth & Resend)

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **9.1** | Add & Verify Sending Domain in Resend Console | [RESEND-PRODUCTION-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/RESEND-PRODUCTION-PLAN.md#3-resend-domain-verification-protocol) | [ ] READY | Resend status shows "Verified" |
| **9.2** | Add Exact Resend DKIM, SPF, Return-Path to Cloudflare | [RESEND-PRODUCTION-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/RESEND-PRODUCTION-PLAN.md#3-resend-domain-verification-protocol) | [ ] READY | Resend DNS verification checks pass |
| **9.3** | Register Google OAuth App with Production Callback | [OAUTH-PRODUCTION-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OAUTH-PRODUCTION-PLAN.md#2-google-oauth-20-setup-plan-google-cloud-console) | [ ] READY | Test Google OAuth redirect flow |
| **9.4** | Register GitHub OAuth App with Production Callback | [OAUTH-PRODUCTION-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OAUTH-PRODUCTION-PLAN.md#3-github-oauth-20-setup-plan-github-developer-settings) | [ ] READY | Test GitHub OAuth redirect flow |

---

## 11. Phase 10: Production Verification Suite & Launch Gate

| Task | Action Item | Runbook Ref | Status | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **10.1** | Execute Production Verification Suite | [PRODUCTION-VERIFICATION.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PRODUCTION-VERIFICATION.md) | [ ] READY | Automated smoke tests pass 100% |
| **10.2** | Verify Guest Sandbox Flow on `app.argonion.com` | [PRODUCTION-VERIFICATION.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PRODUCTION-VERIFICATION.md) | [ ] READY | Scan complete with zero auth cookies |
| **10.3** | Verify Authenticated Flow on `nebula.argonion.com` | [PRODUCTION-VERIFICATION.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/PRODUCTION-VERIFICATION.md) | [ ] READY | User registration, verification, login, scan |
| **10.4** | Verify Transactional Emails Delivered (Inbox Check) | [RESEND-PRODUCTION-PLAN.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/RESEND-PRODUCTION-PLAN.md) | [ ] READY | Welcome email & verification email received |
| **10.5** | **FINAL GO / NO-GO LAUNCH SIGN-OFF** | [LAUNCH-READINESS-MASTER-CHECKLIST.md](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/LAUNCH-READINESS-MASTER-CHECKLIST.md) | [ ] READY | Formal sign-off by Swasthik K J |
