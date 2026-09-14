#!/usr/bin/env bash
# ==============================================================================
# Nebula Production Cloud Run Services Deployment Script
# Ticket: GCP-001 — Service Deployment Foundation
# ==============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-nebula-production}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO_NAME="${ARTIFACT_REPO_NAME:-nebula-docker-repo}"
INSTANCE_NAME="${DB_INSTANCE_NAME:-nebula-prod-postgres}"
VERSION="${VERSION:-v1.0.0}"
VPC_CONNECTOR="${VPC_CONNECTOR:-nebula-vpc-conn}"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-https://app.argonion.com}"

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO_NAME}"
API_IMAGE="${REGISTRY}/nebula-api:${VERSION}"
WORKER_IMAGE="${REGISTRY}/nebula-worker:${VERSION}"
WEB_IMAGE="${REGISTRY}/nebula-web:${VERSION}"

CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"

echo "=============================================================================="
echo "Deploying Nebula Production Services to Google Cloud Run"
echo "Project ID    : ${PROJECT_ID}"
echo "Region        : ${REGION}"
echo "API Image     : ${API_IMAGE}"
echo "Worker Image  : ${WORKER_IMAGE}"
echo "Web Image     : ${WEB_IMAGE}"
echo "Cloud SQL     : ${CONNECTION_NAME}"
echo "VPC Connector : ${VPC_CONNECTOR}"
echo "=============================================================================="

# 1. Deploy Nebula API Service
echo "==> [1/3] Deploying Nebula API Service (NestJS)..."
gcloud run deploy nebula-prod-api \
  --image="${API_IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --service-account="nebula-prod-api-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --vpc-connector="${VPC_CONNECTOR}" \
  --vpc-egress="private-ranges-only" \
  --add-cloudsql-instances="${CONNECTION_NAME}" \
  --set-env-vars="NODE_ENV=production,PORT=8080,WORKER_ENABLED=false,EMAIL_PROVIDER=resend,FRONTEND_URL=${FRONTEND_DOMAIN},CORS_ALLOWED_ORIGINS=${FRONTEND_DOMAIN},RATE_LIMIT_ENABLED=true" \
  --set-secrets="DATABASE_URL=nebula-prod-database-url:latest,JWT_ACCESS_SECRET=nebula-prod-jwt-access-secret:latest,JWT_REFRESH_SECRET=nebula-prod-jwt-refresh-secret:latest,RESEND_API_KEY=nebula-prod-resend-api-key:latest" \
  --min-instances=1 \
  --max-instances=10 \
  --cpu="1" \
  --memory="1024Mi" \
  --port=8080 \
  --allow-unauthenticated \
  --quiet

# 2. Deploy Nebula Understanding Worker Service (Dedicated Background Execution)
echo "==> [2/3] Deploying Nebula Understanding Worker Service..."
gcloud run deploy nebula-prod-worker \
  --image="${WORKER_IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --service-account="nebula-prod-worker-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --vpc-connector="${VPC_CONNECTOR}" \
  --vpc-egress="private-ranges-only" \
  --add-cloudsql-instances="${CONNECTION_NAME}" \
  --set-env-vars="NODE_ENV=production,WORKER_ENABLED=true,WORKER_MODE=standalone" \
  --set-secrets="DATABASE_URL=nebula-prod-database-url:latest" \
  --no-cpu-throttling \
  --min-instances=1 \
  --max-instances=3 \
  --cpu="2" \
  --memory="2048Mi" \
  --ingress="internal" \
  --no-allow-unauthenticated \
  --quiet

# 3. Deploy Nebula Web Frontend Service (React SPA via Nginx)
echo "==> [3/3] Deploying Nebula Web Frontend Service..."
gcloud run deploy nebula-prod-web \
  --image="${WEB_IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --min-instances=1 \
  --max-instances=10 \
  --cpu="1" \
  --memory="512Mi" \
  --port=8080 \
  --allow-unauthenticated \
  --quiet

echo "=============================================================================="
echo "✅ All Nebula Production Services Deployed Successfully"
echo "=============================================================================="
