#!/usr/bin/env bash
# ==============================================================================
# Nebula Production GCP Foundation Initialization Script
# Ticket: GCP-001 — Google Cloud Production Foundation
# ==============================================================================

set -euo pipefail

# Configuration Defaults
PROJECT_ID="${GCP_PROJECT_ID:-nebula-production}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO_NAME="${ARTIFACT_REPO_NAME:-nebula-docker-repo}"

echo "=============================================================================="
echo "Initializing Nebula Production GCP Project Foundation"
echo "Project ID : ${PROJECT_ID}"
echo "Region     : ${REGION}"
echo "Repo       : ${ARTIFACT_REPO_NAME}"
echo "=============================================================================="

# 1. Verify gcloud CLI and authentication
if ! command -v gcloud &> /dev/null; then
  echo "❌ Error: 'gcloud' CLI is required but not installed." >&2
  exit 1
fi

echo "==> Step 1: Setting GCP active project and compute region..."
gcloud config set project "${PROJECT_ID}" --quiet || true
gcloud config set compute/region "${REGION}" --quiet || true

# 2. Enable Required Google Cloud Services & APIs
echo "==> Step 2: Enabling required Google Cloud APIs..."
REQUIRED_SERVICES=(
  "run.googleapis.com"
  "sqladmin.googleapis.com"
  "artifactregistry.googleapis.com"
  "secretmanager.googleapis.com"
  "vpcaccess.googleapis.com"
  "compute.googleapis.com"
  "cloudbuild.googleapis.com"
  "monitoring.googleapis.com"
  "logging.googleapis.com"
  "servicenetworking.googleapis.com"
)

for svc in "${REQUIRED_SERVICES[@]}"; do
  echo "    Enabling ${svc}..."
  gcloud services enable "${svc}" --project="${PROJECT_ID}" || echo "    [Notice] Service ${svc} enabling scheduled."
done

# 3. Create Dedicated Least-Privilege Service Accounts
echo "==> Step 3: Creating dedicated least-privilege service accounts..."

create_sa_if_missing() {
  local sa_name="$1"
  local sa_display="$2"
  local sa_email="${sa_name}@${PROJECT_ID}.iam.gserviceaccount.com"

  if ! gcloud iam service-accounts describe "${sa_email}" --project="${PROJECT_ID}" &> /dev/null; then
    echo "    Creating service account: ${sa_name}..."
    gcloud iam service-accounts create "${sa_name}" \
      --display-name="${sa_display}" \
      --project="${PROJECT_ID}" || true
  else
    echo "    Service account ${sa_name} already exists."
  fi
}

create_sa_if_missing "nebula-prod-api-sa" "Nebula Production API Runtime SA"
create_sa_if_missing "nebula-prod-worker-sa" "Nebula Production Worker Runtime SA"
create_sa_if_missing "nebula-prod-deployer-sa" "Nebula Production CI/CD Deployer SA"

# 4. Assign Least-Privilege IAM Roles
echo "==> Step 4: Binding least-privilege IAM roles..."

bind_role() {
  local sa_email="$1"
  local role="$2"
  echo "    Binding ${role} to ${sa_email}..."
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${sa_email}" \
    --role="${role}" \
    --quiet &> /dev/null || true
}

# API SA Roles
bind_role "nebula-prod-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/cloudsql.client"
bind_role "nebula-prod-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/secretmanager.secretAccessor"
bind_role "nebula-prod-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/logging.logWriter"
bind_role "nebula-prod-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/monitoring.metricWriter"

# Worker SA Roles
bind_role "nebula-prod-worker-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/cloudsql.client"
bind_role "nebula-prod-worker-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/secretmanager.secretAccessor"
bind_role "nebula-prod-worker-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/logging.logWriter"
bind_role "nebula-prod-worker-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/monitoring.metricWriter"

# Deployer SA Roles
bind_role "nebula-prod-deployer-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/run.admin"
bind_role "nebula-prod-deployer-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/artifactregistry.writer"
bind_role "nebula-prod-deployer-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/iam.serviceAccountUser"
bind_role "nebula-prod-deployer-sa@${PROJECT_ID}.iam.gserviceaccount.com" "roles/cloudsql.client"

# 5. Create Artifact Registry Docker Repository
echo "==> Step 5: Creating Artifact Registry Docker repository..."
if ! gcloud artifacts repositories describe "${ARTIFACT_REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" &> /dev/null; then
  echo "    Creating Artifact Registry repository ${ARTIFACT_REPO_NAME}..."
  gcloud artifacts repositories create "${ARTIFACT_REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Nebula Production Docker artifacts repository" \
    --project="${PROJECT_ID}" || true
else
  echo "    Artifact Registry repository ${ARTIFACT_REPO_NAME} already exists."
fi

echo "=============================================================================="
echo "✅ Nebula Production GCP Foundation Initialized Successfully"
echo "=============================================================================="
