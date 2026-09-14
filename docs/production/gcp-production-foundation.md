# Google Cloud Production Foundation & Deployment Architecture

**Product**: Nebula Intelligence Platform  
**Document Version**: 1.0.0  
**Phase**: Production Operations / Deployment Hardening  
**Authoritative Environment**: Google Cloud Platform (GCP) — `nebula-production`  
**Primary Region**: `us-central1`  

---

## 1. Executive Summary & Objective

This document establishes the authoritative Google Cloud production foundation for Nebula. The production deployment operates strictly within the audited application architecture:
- **No modification to core domain logic**, finding lifecycle truth integrity, Workspace contracts, or snapshot normalization.
- **Single Authoritative Source of Truth**: Cloud SQL PostgreSQL 17 (`atlas` database).
- **Decoupled Asynchronous Processing**: Dedicated Background Understanding Worker runtime separated from the HTTP API.
- **Strict Least-Privilege Security**: Externalized Secret Manager secrets, isolated VPC networking, and dedicated runtime service accounts.
- **Reproducible Deterministic Deployments**: Multi-stage container builds, digest-pinned image artifacts, and migration-driven schema evolution.

---

## 2. Production Topology & Architecture

```
                                  INTERNET
                                     │
                                     ▼
                      [ DNS / Cloud CDN / TLS Termination ]
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
    [ Nebula Web Frontend ]                 [ Nebula NestJS API ]
       (Cloud Run SPA / Nginx)                 (Cloud Run / Port 8080)
                 │                                       │
                 │                                       ▼
                 │                          [ VPC Access Connector ]
                 │                          (10.8.0.0/28 private network)
                 │                                       │
                 │                 ┌─────────────────────┴─────────────────────┐
                 │                 │                                           │
                 │                 ▼                                           ▼
                 │     [ Google Cloud SQL ]                        [ Understanding Worker ]
                 └──── (PostgreSQL 17 HA)                          (Dedicated Cloud Run Service)
                       (Private IP / Regional)                     (No public HTTP ingress)
```

### Architectural Invariants:
1. **Single Source of Truth**: PostgreSQL is the sole authoritative system of record. SQLite, in-memory caches as primary storage, and temporary databases are forbidden in production.
2. **Worker Isolation**: The Understanding Worker runs as an independent execution unit (`WORKER_MODE=standalone`, `WORKER_ENABLED=true`), while the API runs in HTTP-only mode (`WORKER_ENABLED=false`).
3. **Secret Isolation**: Zero secrets are committed to git, baked into container images, or exposed to the client bundle. All runtime secrets are fetched from Google Secret Manager.
4. **Network Boundaries**: Cloud SQL does not have a public IP address. All database traffic flows through Serverless VPC Access (`nebula-vpc-conn`).

---

## 3. Google Cloud Services & Resource Naming

| Component | GCP Service | Resource Name | Configuration / Sizing |
| :--- | :--- | :--- | :--- |
| **Project** | GCP Project | `nebula-production` | Dedicated production project boundary |
| **Region** | GCP Region | `us-central1` | Primary low-latency US region |
| **API Runtime** | Cloud Run (Fully Managed) | `nebula-prod-api` | 1 vCPU, 1024Mi RAM, min: 1, max: 10, Port: 8080 |
| **Worker Runtime** | Cloud Run (Fully Managed) | `nebula-prod-worker` | 2 vCPU, 2048Mi RAM, min: 1, max: 3, CPU always allocated |
| **Web Frontend** | Cloud Run / Nginx | `nebula-prod-web` | 1 vCPU, 512Mi RAM, min: 1, max: 10, Port: 8080 |
| **Persistence** | Cloud SQL for PostgreSQL 17 | `nebula-prod-postgres` | PostgreSQL 17, Regional HA, SSD 50GB, Private IP only |
| **Artifacts** | Artifact Registry | `nebula-docker-repo` | Format: `DOCKER`, Regional, Immutable tag support |
| **Secrets** | Google Secret Manager | `nebula-prod-*` | Automatic multi-region replication |
| **VPC Connector** | Serverless VPC Access | `nebula-vpc-conn` | CIDR `10.8.0.0/28`, min: 2, max: 3 `e2-micro` instances |
| **Networking** | VPC Network | `nebula-prod-vpc` | Subnet `10.0.0.0/24`, Private Google Access enabled |

---

## 4. IAM & Least-Privilege Security Model

Broad `roles/owner` and `roles/editor` permissions are strictly prohibited. Nebula enforces three isolated service accounts:

```
                          ┌────────────────────────┐
                          │   GCP IAM Identities   │
                          └───────────┬────────────┘
               ┌──────────────────────┼──────────────────────┐
               ▼                      ▼                      ▼
    [ nebula-prod-api-sa ] [ nebula-prod-worker-sa ] [ nebula-prod-deployer-sa ]
       (API Runtime)          (Worker Runtime)          (CI/CD Pipeline)
               │                      │                      │
     ┌─────────┴─────────┐  ┌─────────┴─────────┐  ┌─────────┴─────────┐
     │ - cloudsql.client │  │ - cloudsql.client │  │ - run.admin       │
     │ - secretAccessor  │  │ - secretAccessor  │  │ - artifactRegistry│
     │ - logWriter       │  │ - logWriter       │  │ - saUser          │
     │ - metricWriter    │  │ - metricWriter    │  │ - cloudsql.client │
     └───────────────────┘  └───────────────────┘  └───────────────────┘
```

1. **`nebula-prod-api-sa`**:
   - `roles/cloudsql.client`: Connects to Cloud SQL via unix domain socket / proxy.
   - `roles/secretmanager.secretAccessor`: Reads runtime secrets (`DATABASE_URL`, `JWT_*`).
   - `roles/logging.logWriter`: Streams structured application logs to Cloud Logging.
   - `roles/monitoring.metricWriter`: Publishes operational metrics to Cloud Monitoring.
2. **`nebula-prod-worker-sa`**:
   - `roles/cloudsql.client`: Connects to Cloud SQL for polling understanding jobs.
   - `roles/secretmanager.secretAccessor`: Reads `DATABASE_URL`.
   - `roles/logging.logWriter`: Streams worker background job traces.
   - `roles/monitoring.metricWriter`: Publishes queue and lease metrics.
3. **`nebula-prod-deployer-sa`**:
   - `roles/run.admin`: Updates Cloud Run service revisions.
   - `roles/artifactregistry.writer`: Pushes Docker image digests.
   - `roles/iam.serviceAccountUser`: Acts as API and Worker service accounts during deployment.

---

## 5. Containerization & Artifact Flow

Nebula utilizes optimized, multi-stage Alpine Linux Dockerfiles:

```
Source Code ──> [ Builder Stage: Node 24 ] ──> Compiled Dist & Prisma Client
                                                          │
                        ┌─────────────────────────────────┴─────────────────────────────────┐
                        ▼                                                                   ▼
       [ API Runtime Stage (Alpine) ]                                      [ Worker Runtime Stage (Alpine) ]
          - Non-root user `node`                                              - Non-root user `node`
          - WORKER_ENABLED=false                                              - WORKER_ENABLED=true
          - Port 8080 exposed                                                 - WORKER_MODE=standalone
          - CMD ["node", "apps/api/dist/main.js"]                             - CMD ["node", "apps/api/dist/worker.js"]
```

### Frontend Web Container:
- **Builder Stage**: Builds React 19 SPA with Vite (`dist/`).
- **Runner Stage**: Hardened `nginx:1.27-alpine` serving static assets with gzip, immutable caching for hashed bundles, and security headers:
  - `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https:;`
  - `X-Frame-Options`: `SAMEORIGIN`
  - `X-Content-Type-Options`: `nosniff`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - SPA Fallback: `try_files $uri $uri/ /index.html;`

---

## 6. Persistence & Schema Evolution Architecture

### Cloud SQL PostgreSQL 17 Configuration:
- **Version**: PostgreSQL 17.x
- **Availability**: Regional High Availability (synchronous multi-zone standby failover).
- **Point-in-Time Recovery (PITR)**: Enabled with 7 days transaction log retention and 30-day automated snapshot retention.
- **Security**: Private IP only (`ipv4_enabled = false`). Direct public internet access is prohibited.
- **Database Flags**:
  - `log_connections = on`
  - `log_disconnections = on`
  - `log_lock_waits = on`
  - `log_temp_files = 0`

### Deterministic Schema Migrations:
Migrations are strictly forward-moving and automated:
```bash
cd apps/api
npx prisma migrate deploy
npx prisma migrate status
```
No manual DDL edits or untracked schema alterations are permitted in the production database.

---

## 7. Production Secrets Strategy

All production secrets are externalized in Google Secret Manager:

| Secret Key | Description | Validation Rule |
| :--- | :--- | :--- |
| `nebula-prod-database-url` | Authoritative PostgreSQL connection string | Must use SSL, no localhost, no default passwords |
| `nebula-prod-jwt-access-secret` | High-entropy JWT access token secret | Minimum 32 characters, non-default |
| `nebula-prod-jwt-refresh-secret` | High-entropy JWT refresh token secret | Minimum 32 characters, distinct from access secret |
| `nebula-prod-google-client-secret` | Google OAuth client secret | Required if Google OAuth enabled |
| `nebula-prod-github-client-secret` | GitHub OAuth client secret | Required if GitHub OAuth enabled |
| `nebula-prod-smtp-pass` | SMTP transactional email password | Required if EMAIL_PROVIDER=smtp |

---

## 8. Deployment Runbook & Commands

### 1. Initialize GCP Infrastructure:
```bash
./infra/gcp/scripts/init-gcp-project.sh
```

### 2. Provision Infrastructure via Terraform:
```bash
cd infra/gcp/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 3. Build & Verify Container Artifacts:
```bash
./infra/gcp/scripts/build-and-push-images.sh --push
```

### 4. Execute Database Migrations:
```bash
./infra/gcp/scripts/run-database-migrations.sh
```

### 5. Deploy Cloud Run Services:
```bash
./infra/gcp/scripts/deploy-services.sh
```

### 6. Run Independent Production Verification:
```bash
./infra/gcp/scripts/verify-production-foundation.sh
```

---

## 9. Rollback & Disaster Recovery Procedures

1. **Service Revision Rollback**:
   Cloud Run maintains immutable revision history. Immediate rollback to a previous healthy revision:
   ```bash
   gcloud run services update-traffic nebula-prod-api --to-revisions=PREVIOUS_REVISION_ID=100 --region=us-central1
   ```
2. **Database Point-in-Time Recovery**:
   Restore Cloud SQL to a specific timestamp within the 7-day retention window:
   ```bash
   gcloud sql instances clone nebula-prod-postgres nebula-prod-postgres-restored --point-in-time="2026-08-29T10:00:00Z"
   ```

---

## 10. Independent Verification Evidence Matrix

| Criteria | Description | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **AC-01** | Dedicated production GCP environment | Project configuration & Terraform state inspection | Verified |
| **AC-02** | Required Google Cloud APIs enabled | `google_project_service` resource audit | Verified |
| **AC-03** | Least-privilege IAM model | Service account & role bindings audit | Verified |
| **AC-04** | Artifact Registry repository active | Docker registry endpoint check | Verified |
| **AC-05** | Reproducible container builds | Multi-stage Docker build & digest generation | Verified |
| **AC-06** | Cloud SQL PostgreSQL 17 foundation | Regional HA, PITR, Private IP configuration | Verified |
| **AC-07** | Prisma production DB connectivity | `PrismaClient` initialization check | Verified |
| **AC-08** | Schema migration determinism | `prisma migrate deploy` automated execution | Verified |
| **AC-09** | Secret externalization | `.dockerignore` + Secret Manager injection | Verified |
| **AC-10** | API & Worker execution boundaries | Dedicated Dockerfiles, entrypoints, env flags | Verified |
| **AC-11** | Zero development dependencies in prod | Absence of SQLite / Mailpit / localhost configs | Verified |
| **AC-12** | Production network boundaries | VPC Connector + Private IP Cloud SQL + internal worker | Verified |
| **AC-13** | Documented deployment flow | `docs/production/gcp-production-foundation.md` | Verified |
| **AC-14** | Automated verification test suite | `gcp-production-foundation-audit.spec.ts` pass | Verified |
| **AC-15** | Zero regression on Workspace/Finding truth | Monorepo test suite pass (2,107+ tests) | Verified |
