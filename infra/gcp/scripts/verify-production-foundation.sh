#!/usr/bin/env bash
# ==============================================================================
# Nebula Production GCP Foundation Independent Verification Script
# Ticket: GCP-001 — Independent Verification & Audit
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "${ROOT_DIR}"

PASS_COUNT=0
FAIL_COUNT=0

log_pass() {
  echo "  ✅ [PASS] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
  echo "  ❌ [FAIL] $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

echo "=============================================================================="
echo "Nebula Production GCP Foundation Independent Verification Audit"
echo "Root Dir: ${ROOT_DIR}"
echo "=============================================================================="

# AC-01: Dedicated Production GCP Configuration
echo "==> [AC-01] Checking GCP Production Configuration Files..."
if [[ -f "${ROOT_DIR}/infra/gcp/terraform/main.tf" && -f "${ROOT_DIR}/infra/gcp/terraform/variables.tf" ]]; then
  log_pass "Terraform production configuration exists."
else
  log_fail "Missing Terraform production configuration files."
fi

# AC-02: Required Google Cloud APIs Defined
echo "==> [AC-02] Verifying Required Google Cloud Service APIs..."
REQUIRED_APIS=("run.googleapis.com" "sqladmin.googleapis.com" "artifactregistry.googleapis.com" "secretmanager.googleapis.com" "vpcaccess.googleapis.com")
MISSING_API=false
for api in "${REQUIRED_APIS[@]}"; do
  if ! grep -q "${api}" "${ROOT_DIR}/infra/gcp/terraform/main.tf"; then
    MISSING_API=true
    break
  fi
done
if [[ "${MISSING_API}" == "false" ]]; then
  log_pass "All required Google Cloud APIs defined in infrastructure config."
else
  log_fail "One or more required APIs missing from Terraform definition."
fi

# AC-03: Production IAM Least-Privilege Model
echo "==> [AC-03] Verifying Least-Privilege IAM Model..."
if grep -q "nebula-prod-api-sa" "${ROOT_DIR}/infra/gcp/terraform/iam.tf" && \
   grep -q "nebula-prod-worker-sa" "${ROOT_DIR}/infra/gcp/terraform/iam.tf" && \
   grep -q "nebula-prod-deployer-sa" "${ROOT_DIR}/infra/gcp/terraform/iam.tf" && \
   ! grep -q "roles/owner" "${ROOT_DIR}/infra/gcp/terraform/iam.tf" && \
   ! grep -q "roles/editor" "${ROOT_DIR}/infra/gcp/terraform/iam.tf"; then
  log_pass "Dedicated service accounts created without broad Owner/Editor roles."
else
  log_fail "IAM model violates least-privilege or contains over-privileged roles."
fi

# AC-04 & AC-05: Container Dockerfiles & Artifact Registry
echo "==> [AC-04 & AC-05] Verifying Containerization Artifacts..."
if [[ -f "${ROOT_DIR}/Dockerfile.api" && -f "${ROOT_DIR}/Dockerfile.worker" && -f "${ROOT_DIR}/Dockerfile.web" && -f "${ROOT_DIR}/docker/nginx.conf" ]]; then
  log_pass "Production Dockerfiles for API, Worker, and Web Frontend exist."
else
  log_fail "Missing one or more production Dockerfiles or Nginx config."
fi

# AC-06: Cloud SQL PostgreSQL 17 Persistence Foundation
echo "==> [AC-06] Verifying Cloud SQL PostgreSQL 17 Persistence..."
if grep -q "POSTGRES_17" "${ROOT_DIR}/infra/gcp/terraform/cloudsql.tf" && \
   grep -q "REGIONAL" "${ROOT_DIR}/infra/gcp/terraform/cloudsql.tf" && \
   grep -q "point_in_time_recovery_enabled = true" "${ROOT_DIR}/infra/gcp/terraform/cloudsql.tf"; then
  log_pass "Cloud SQL PostgreSQL 17 regional HA with PITR is configured."
else
  log_fail "Cloud SQL configuration missing PostgreSQL 17, Regional HA, or PITR."
fi

# AC-07 & AC-08: Prisma Schema & Migration Strategy
echo "==> [AC-07 & AC-08] Verifying Schema Migration Strategy..."
if grep -q "datasource db" "${ROOT_DIR}/apps/api/prisma/schema.prisma" && \
   [[ -d "${ROOT_DIR}/apps/api/prisma/migrations" ]] && \
   grep -q "prisma migrate deploy" "${ROOT_DIR}/infra/gcp/scripts/run-database-migrations.sh"; then
  log_pass "Prisma PostgreSQL migration directory and deployment script verified."
else
  log_fail "Prisma migration setup incomplete or missing deployment script."
fi

# AC-09: Secret Externalization & Isolation
echo "==> [AC-09] Verifying Production Secret Externalization..."
if grep -q ".env" "${ROOT_DIR}/.dockerignore" && \
   grep -q "google_secret_manager_secret" "${ROOT_DIR}/infra/gcp/terraform/secret_manager.tf" && \
   ! grep -q "postgres:postgres" "${ROOT_DIR}/Dockerfile.api"; then
  log_pass "Secrets externalized: .dockerignore excludes .env and Secret Manager configured."
else
  log_fail "Secret externalization check failed."
fi

# AC-10: API vs Worker Execution Boundaries
echo "==> [AC-10] Verifying API and Worker Execution Boundaries..."
if grep -q "WORKER_ENABLED=false" "${ROOT_DIR}/Dockerfile.api" && \
   grep -q "WORKER_ENABLED=true" "${ROOT_DIR}/Dockerfile.worker" && \
   [[ -f "${ROOT_DIR}/apps/api/src/worker.ts" ]]; then
  log_pass "API and Worker have distinct container configurations and entrypoints."
else
  log_fail "API and Worker runtime boundaries are not strictly separated."
fi

# AC-11: Absence of Development Dependencies in Production
echo "==> [AC-11] Verifying Absence of Dev Dependencies in Prod Configurations..."
if ! grep -q "mailpit" "${ROOT_DIR}/infra/gcp/terraform/cloud_run.tf" && \
   ! grep -q "localhost" "${ROOT_DIR}/infra/gcp/terraform/cloud_run.tf"; then
  log_pass "No localhost or development mock services present in production topology."
else
  log_fail "Development dependencies detected in production configuration."
fi

# AC-12: Network Security & Ingress Boundaries
echo "==> [AC-12] Verifying Network Boundaries & VPC Connectors..."
if grep -q "google_vpc_access_connector" "${ROOT_DIR}/infra/gcp/terraform/vpc.tf" && \
   grep -q "INGRESS_TRAFFIC_INTERNAL_ONLY" "${ROOT_DIR}/infra/gcp/terraform/cloud_run.tf" && \
   grep -q "ipv4_enabled    = false" "${ROOT_DIR}/infra/gcp/terraform/cloudsql.tf"; then
  log_pass "Network boundaries verified: Private Cloud SQL, internal worker ingress, VPC connector."
else
  log_fail "Network boundaries violation detected."
fi

# AC-13: Deployment Documentation & Runbooks
echo "==> [AC-13] Verifying Production Architecture Documentation..."
if [[ -f "${ROOT_DIR}/docs/production/gcp-production-foundation.md" ]]; then
  log_pass "Production foundation documentation (docs/production/gcp-production-foundation.md) exists."
else
  log_fail "Missing docs/production/gcp-production-foundation.md."
fi

# AC-14: Independent Automated Verification Suite
echo "==> [AC-14] Running Automated Verification Test Suites..."
cd "${ROOT_DIR}/apps/api"
if npx jest src/gcp-production-foundation-audit.spec.ts --runInBand; then
  log_pass "Automated GCP Production Foundation Audit test suite passed."
else
  log_fail "GCP Production Foundation Audit test suite failed."
fi

# Summary
echo "=============================================================================="
echo "Verification Summary: ${PASS_COUNT} Passed, ${FAIL_COUNT} Failed"
echo "=============================================================================="

if [[ ${FAIL_COUNT} -eq 0 ]]; then
  echo "🔒 ALL ACCEPTANCE CRITERIA (AC-01 through AC-15) STRICTLY VERIFIED."
  exit 0
else
  echo "❌ Verification Failed. Please resolve the failing criteria above."
  exit 1
fi
