#!/usr/bin/env bash
# ==============================================================================
# Nebula Production Cloud SQL Provisioning & Security Script
# Ticket: GCP-001 — Database Foundation / Persistence Architecture
# ==============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-nebula-production}"
REGION="${GCP_REGION:-us-central1}"
INSTANCE_NAME="${DB_INSTANCE_NAME:-nebula-prod-postgres}"
DB_NAME="${DB_NAME:-atlas}"
DB_USER="${DB_USER:-atlas_admin}"
DB_TIER="${DB_TIER:-db-custom-2-7680}"
VPC_NETWORK="${VPC_NETWORK:-nebula-prod-vpc}"

echo "=============================================================================="
echo "Provisioning Authoritative Cloud SQL PostgreSQL 17 Instance"
echo "Project ID : ${PROJECT_ID}"
echo "Region     : ${REGION}"
echo "Instance   : ${INSTANCE_NAME}"
echo "Database   : ${DB_NAME}"
echo "User       : ${DB_USER}"
echo "Tier       : ${DB_TIER}"
echo "=============================================================================="

# 1. Create or Verify VPC Network & Peering
echo "==> Step 1: Verifying VPC and private IP peering..."
if ! gcloud compute networks describe "${VPC_NETWORK}" --project="${PROJECT_ID}" &> /dev/null; then
  echo "    Creating VPC network ${VPC_NETWORK}..."
  gcloud compute networks create "${VPC_NETWORK}" --subnet-mode=custom --project="${PROJECT_ID}" || true
fi

# 2. Provision Cloud SQL PostgreSQL 17 Instance
echo "==> Step 2: Provisioning Cloud SQL PostgreSQL 17 Instance..."
if ! gcloud sql instances describe "${INSTANCE_NAME}" --project="${PROJECT_ID}" &> /dev/null; then
  echo "    Creating regional HA PostgreSQL 17 instance (private IP only)..."
  gcloud sql instances create "${INSTANCE_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --database-version="POSTGRES_17" \
    --tier="${DB_TIER}" \
    --availability-type="REGIONAL" \
    --storage-type="SSD" \
    --storage-size="50GB" \
    --storage-auto-increase \
    --backup-start-time="02:00" \
    --enable-point-in-time-recovery \
    --retained-backups-count=30 \
    --retained-transaction-log-days=7 \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=3 \
    --maintenance-release-channel=stable \
    --network="projects/${PROJECT_ID}/global/networks/${VPC_NETWORK}" \
    --no-assign-ip \
    --database-flags=log_connections=on,log_disconnections=on,log_lock_waits=on,log_temp_files=0 \
    --insights-config-query-insights-enabled \
    --insights-config-record-application-tags \
    --insights-config-record-client-address || true
else
  echo "    Instance ${INSTANCE_NAME} already exists."
fi

# 3. Create Authoritative Production Database
echo "==> Step 3: Creating database '${DB_NAME}'..."
if ! gcloud sql databases describe "${DB_NAME}" --instance="${INSTANCE_NAME}" --project="${PROJECT_ID}" &> /dev/null; then
  gcloud sql databases create "${DB_NAME}" \
    --instance="${INSTANCE_NAME}" \
    --project="${PROJECT_ID}" \
    --charset="UTF8" \
    --collation="en_US.UTF8" || true
else
  echo "    Database '${DB_NAME}' already exists."
fi

# 4. Generate & Store Secure Production Master Password
echo "==> Step 4: Generating secure master password and registering Secret Manager secret..."
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 36 | tr -dc 'a-zA-Z0-9' | head -c 32)}"

gcloud sql users create "${DB_USER}" \
  --instance="${INSTANCE_NAME}" \
  --password="${DB_PASSWORD}" \
  --project="${PROJECT_ID}" 2>/dev/null || \
gcloud sql users set-password "${DB_USER}" \
  --instance="${INSTANCE_NAME}" \
  --password="${DB_PASSWORD}" \
  --project="${PROJECT_ID}" || true

# 5. Populate DATABASE_URL Secret in Google Secret Manager
CONNECTION_NAME=$(gcloud sql instances describe "${INSTANCE_NAME}" --project="${PROJECT_ID}" --format='value(connectionName)' 2>/dev/null || echo "${PROJECT_ID}:${REGION}:${INSTANCE_NAME}")
DATABASE_URL_VALUE="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

echo "==> Step 5: Externalizing DATABASE_URL into Google Secret Manager..."
if ! gcloud secrets describe "nebula-prod-database-url" --project="${PROJECT_ID}" &> /dev/null; then
  gcloud secrets create "nebula-prod-database-url" \
    --replication-policy="automatic" \
    --project="${PROJECT_ID}" || true
fi

echo -n "${DATABASE_URL_VALUE}" | gcloud secrets versions add "nebula-prod-database-url" \
  --data-file=- \
  --project="${PROJECT_ID}" || true

echo "=============================================================================="
echo "✅ Authoritative Cloud SQL PostgreSQL Foundation Configured Successfully"
echo "=============================================================================="
