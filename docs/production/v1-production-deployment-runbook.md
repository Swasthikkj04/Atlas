# Nebula V1 — Production Deployment & Operations Runbook

**Version:** 1.0.0  
**Target Environment:** Google Cloud Platform (GCP)  
**Primary Region:** `us-central1`  
**Authoritative Domain:** `argonion.com` / `www.argonion.com` / `app.argonion.com`  
**Classification:** Operational Blueprint & Release Runbook  

---

## 1. Production Architecture Overview

Nebula V1 runs on Google Cloud Platform with complete runtime isolation between client traffic, background understanding workloads, and persistent state.

```
                  ┌─────────────────────────────────────────────────┐
                  │              Cloud DNS / Cloud Armor            │
                  │             https://app.argonion.com            │
                  └────────────────────────┬────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
       ┌─────────────────────────┐                   ┌─────────────────────────┐
       │   nebula-prod-web       │                   │   nebula-prod-api       │
       │   (Cloud Run - Nginx)   │                   │   (Cloud Run - NestJS)  │
       │   Port: 8080            │                   │   Port: 8080            │
       │   Min: 1 | Max: 10      │                   │   Min: 1 | Max: 10      │
       └─────────────────────────┘                   └────────────┬────────────┘
                                                                  │
                                                        VPC Serverless Connector
                                                        (nebula-vpc-conn)
                                                                  │
                                      ┌───────────────────────────┴───────────────────────────┐
                                      │                                                       │
                                      ▼                                                       ▼
                         ┌─────────────────────────┐                             ┌─────────────────────────┐
                         │   nebula-prod-worker    │                             │  nebula-prod-postgres   │
                         │ (Cloud Run - Standalone)│                             │   (Cloud SQL Postgres 17│
                         │   CPU Throttling: OFF   │                             │    Regional HA + PITR)  │
                         │   Min: 1 | Max: 3       │                             │    Private IP Only      │
                         └────────────┬────────────┘                             └────────────▲────────────┘
                                      │                                                       │
                                      └───────────────────────────────────────────────────────┘
```

---

## 2. Pre-Deployment Secret & Configuration Inventory

All sensitive credentials MUST be stored in Google Cloud Secret Manager. Zero secrets may be embedded in container images or committed to version control.

### Secret Manager Required Variables

| Secret Name | Secret ID | Format / Requirements | Description |
|---|---|---|---|
| `DATABASE_URL` | `nebula-prod-database-url` | `postgresql://atlas_admin:<PASSWORD>@/atlas?host=/cloudsql/<PROJECT_ID>:<REGION>:<INSTANCE>` | Cloud SQL private connection string |
| `JWT_ACCESS_SECRET` | `nebula-prod-jwt-access-secret` | High-entropy random string (>= 64 chars) | Cryptographic signature for access tokens (15m expiry) |
| `JWT_REFRESH_SECRET` | `nebula-prod-jwt-refresh-secret` | High-entropy random string (>= 64 chars, distinct from access) | Signature for rotating refresh tokens (7d expiry) |
| `GOOGLE_CLIENT_ID` | `nebula-prod-google-client-id` | `*.apps.googleusercontent.com` | Google OAuth 2.0 Web Application Client ID |
| `GOOGLE_CLIENT_SECRET` | `nebula-prod-google-client-secret` | Alphanumeric secret | Google OAuth 2.0 Client Secret |
| `GITHUB_CLIENT_ID` | `nebula-prod-github-client-id` | Hexadecimal client ID | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | `nebula-prod-github-client-secret` | Alphanumeric secret | GitHub OAuth App Client Secret |
| `SMTP_PASS` | `nebula-prod-smtp-pass` | Secure password / App password | Legacy transactional email provider password (optional) |
| `RESEND_API_KEY` | `nebula-prod-resend-api-key` | Resend API Key (`re_...`) for verified domain `argonion.com` | Primary production outbound transactional email provider API key |

---

## 3. Turnkey GCP Deployment Execution

### Step 1: Initialize GCP Project & IAM Service Accounts

Run the initialization script to enable APIs and provision least-privilege service accounts:

```bash
export GCP_PROJECT_ID="nebula-production"
export GCP_REGION="us-central1"
export ARTIFACT_REPO_NAME="nebula-docker-repo"

bash infra/gcp/scripts/init-gcp-project.sh
```

**What this creates:**
- Google Cloud APIs: `run`, `sqladmin`, `artifactregistry`, `secretmanager`, `vpcaccess`, `compute`
- Service Accounts:
  - `nebula-prod-api-sa` (Cloud SQL Client, Secret Accessor, Logging/Monitoring)
  - `nebula-prod-worker-sa` (Cloud SQL Client, Secret Accessor, Logging/Monitoring)
  - `nebula-prod-deployer-sa` (Cloud Run Admin, Artifact Registry Writer, Cloud SQL Client)
- Artifact Registry: `us-central1-docker.pkg.dev/nebula-production/nebula-docker-repo`

---

### Step 2: Provision Cloud SQL PostgreSQL 17 Instance

```bash
export DB_INSTANCE_NAME="nebula-prod-postgres"
export DB_NAME="atlas"
export DB_USER="atlas_admin"
export DB_TIER="db-custom-2-7680"
export VPC_NETWORK="nebula-prod-vpc"

bash infra/gcp/scripts/deploy-cloud-sql.sh
```

**Verification:**
- PostgreSQL 17 with Regional High Availability
- Automated Daily Backups at 02:00 UTC
- 7-day Point-in-Time Recovery (PITR) transaction logs
- Private IP only (no public IPv4 assigned)
- `nebula-prod-database-url` automatically populated into Google Secret Manager

---

### Step 3: Populate Application Secrets

Generate high-entropy secrets and populate Secret Manager:

```bash
# Generate high entropy cryptographic keys
ACCESS_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)
REFRESH_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)

# Populate Secret Manager
echo -n "${ACCESS_SECRET}" | gcloud secrets versions add "nebula-prod-jwt-access-secret" --data-file=- --project="${GCP_PROJECT_ID}"
echo -n "${REFRESH_SECRET}" | gcloud secrets versions add "nebula-prod-jwt-refresh-secret" --data-file=- --project="${GCP_PROJECT_ID}"

# Populate Resend API Key (re_... for verified sending domain: argonion.com)
echo -n "${RESEND_API_KEY}" | gcloud secrets versions add "nebula-prod-resend-api-key" --data-file=- --project="${GCP_PROJECT_ID}"
```

---

### Step 4: Run Authoritative Database Migrations

Apply non-destructive Prisma schema migrations to Cloud SQL:

```bash
bash infra/gcp/scripts/run-database-migrations.sh
```

**Verification Command:**
```bash
cd apps/api && npx prisma migrate status
```

---

### Step 5: Build & Push Immutable Container Artifacts

Build multi-stage rootless Docker images and push to Google Artifact Registry:

```bash
export VERSION="v1.0.0"
export PUSH="true"

bash infra/gcp/scripts/build-and-push-images.sh --push
```

**Generated Artifacts:**
- `us-central1-docker.pkg.dev/nebula-production/nebula-docker-repo/nebula-api:v1.0.0`
- `us-central1-docker.pkg.dev/nebula-production/nebula-docker-repo/nebula-worker:v1.0.0`
- `us-central1-docker.pkg.dev/nebula-production/nebula-docker-repo/nebula-web:v1.0.0`
- Image provenance recorded in `infra/gcp/artifacts/image-digests.json`

---

### Step 6: Deploy Services to Google Cloud Run

Deploy the API, Worker, and Web services with health checks and autoscaling:

```bash
export VERSION="v1.0.0"
export FRONTEND_DOMAIN="https://app.argonion.com"

bash infra/gcp/scripts/deploy-services.sh
```

---

## 4. Live Health Verification & Smoke Testing

Execute automated validation against deployed endpoints:

```bash
# 1. API Liveness Probe
curl -f -i https://api.argonion.com/api/v1/health/live

# 2. API Readiness Probe (Verifies PostgreSQL connection & Worker state)
curl -f -i https://api.argonion.com/api/v1/health/ready

# 3. Web Frontend Health
curl -f -i https://app.argonion.com/health

# 4. Security Headers Verification
curl -I https://app.argonion.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Content-Security-Policy)"
```

---

## 5. Instant Rollback Procedure

If an unexpected regression is detected post-deployment:

### 1-Click Rollback via Google Cloud CLI

```bash
# Roll back API service to previous revision
PREV_API_REV=$(gcloud run revisions list --service=nebula-prod-api --region=us-central1 --format='value(name)' --limit=2 | tail -n1)
gcloud run services update-traffic nebula-prod-api --to-revisions="${PREV_API_REV}=100" --region=us-central1

# Roll back Worker service
PREV_WORKER_REV=$(gcloud run revisions list --service=nebula-prod-worker --region=us-central1 --format='value(name)' --limit=2 | tail -n1)
gcloud run services update-traffic nebula-prod-worker --to-revisions="${PREV_WORKER_REV}=100" --region=us-central1

# Roll back Web frontend
PREV_WEB_REV=$(gcloud run revisions list --service=nebula-prod-web --region=us-central1 --format='value(name)' --limit=2 | tail -n1)
gcloud run services update-traffic nebula-prod-web --to-revisions="${PREV_WEB_REV}=100" --region=us-central1
```

### Rollback via GitHub Actions Workflow Dispatch
1. Open GitHub Actions → **Production CD & Release Pipeline**
2. Click **Run workflow**
3. In `rollback_target`, enter the known-good Cloud Run revision ID or previous Git commit SHA.
4. Set `skip_migrations = true`.
5. Click **Run workflow** — traffic is instantaneously shifted to the known-good revision.

---

## 6. Point-In-Time Recovery (PITR) Database Restoration

If database state needs to be restored to an exact historical minute:

```bash
# Restore Cloud SQL instance to specific timestamp
gcloud sql instances clone nebula-prod-postgres nebula-prod-postgres-restored \
  --point-in-time="2026-09-09T20:00:00.000Z" \
  --project="nebula-production"
```

Update `nebula-prod-database-url` in Secret Manager to point to `nebula-prod-postgres-restored` to resume production traffic.
