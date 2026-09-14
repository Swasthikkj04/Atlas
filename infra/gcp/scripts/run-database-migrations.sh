#!/usr/bin/env bash
# ==============================================================================
# Nebula Production Database Migration Runner
# Ticket: GCP-001 — Database Foundation / Schema Evolution
# ==============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-nebula-production}"
REGION="${GCP_REGION:-us-central1}"
INSTANCE_NAME="${DB_INSTANCE_NAME:-nebula-prod-postgres}"
DB_NAME="${DB_NAME:-atlas}"
DB_USER="${DB_USER:-atlas_admin}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "${ROOT_DIR}"

echo "=============================================================================="
echo "Executing Authoritative Database Migrations against Google Cloud SQL"
echo "Project ID : ${PROJECT_ID}"
echo "Instance   : ${INSTANCE_NAME}"
echo "Database   : ${DB_NAME}"
echo "User       : ${DB_USER}"
echo "Root Dir   : ${ROOT_DIR}"
echo "=============================================================================="

# 1. Fetch DATABASE_URL from Secret Manager if not set
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "==> Step 1: Retrieving DATABASE_URL from Google Secret Manager..."
  DATABASE_URL=$(gcloud secrets versions access latest --secret="nebula-prod-database-url" --project="${PROJECT_ID}" 2>/dev/null || true)
  
  if [[ -z "${DATABASE_URL}" ]]; then
    echo "    [Notice] DATABASE_URL not found in Secret Manager; constructing from instance details..."
    DB_PASSWORD="${DB_PASSWORD:-}"
    if [[ -z "${DB_PASSWORD}" ]]; then
      echo "❌ Error: DATABASE_URL or DB_PASSWORD must be provided to run migrations." >&2
      exit 1
    fi
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
  fi
fi

# 2. Check and run migrations via Prisma
echo "==> Step 2: Applying schema migrations with Prisma..."
export DATABASE_URL

cd "${ROOT_DIR}/apps/api"
npx prisma migrate deploy

echo "==> Step 3: Verifying migration status..."
npx prisma migrate status

echo "=============================================================================="
echo "✅ Database Schema Migrations Completed & Verified Deterministically"
echo "=============================================================================="
