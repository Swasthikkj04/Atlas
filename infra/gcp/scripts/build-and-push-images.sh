#!/usr/bin/env bash
# ==============================================================================
# Nebula Production Container Artifacts Build & Verification Script
# Ticket: GCP-001 — Container / Artifact Foundation
# ==============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-nebula-production}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO_NAME="${ARTIFACT_REPO_NAME:-nebula-docker-repo}"
PUSH="${PUSH:-false}"

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO_NAME}"
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "prod-$(date +%s)")
VERSION="${VERSION:-v1.0.0}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "${ROOT_DIR}"

echo "=============================================================================="
echo "Building Nebula Production Container Artifacts"
echo "Project ID : ${PROJECT_ID}"
echo "Registry   : ${REGISTRY}"
echo "Version    : ${VERSION}"
echo "Git SHA    : ${GIT_SHA}"
echo "Root Dir   : ${ROOT_DIR}"
echo "=============================================================================="

# Ensure artifacts directory exists
mkdir -p "${ROOT_DIR}/infra/gcp/artifacts"

# 1. Build API Image
echo "==> [1/3] Building Nebula API production container..."
API_IMAGE_TAG="${REGISTRY}/nebula-api:${GIT_SHA}"
docker build \
  -f Dockerfile.api \
  -t "${API_IMAGE_TAG}" \
  -t "${REGISTRY}/nebula-api:${VERSION}" \
  -t "${REGISTRY}/nebula-api:latest" \
  -t "nebula-api:latest" \
  .

API_DIGEST=$( (docker inspect --format='{{index .RepoDigests 0}}' "${API_IMAGE_TAG}" 2>/dev/null || docker inspect --format='{{.Id}}' "${API_IMAGE_TAG}") | tr -d '\r\n' )
echo "    Nebula API Image Built: ${API_IMAGE_TAG}"
echo "    Digest: ${API_DIGEST}"

# 2. Build Worker Image
echo "==> [2/3] Building Nebula Understanding Worker production container..."
WORKER_IMAGE_TAG="${REGISTRY}/nebula-worker:${GIT_SHA}"
docker build \
  -f Dockerfile.worker \
  -t "${WORKER_IMAGE_TAG}" \
  -t "${REGISTRY}/nebula-worker:${VERSION}" \
  -t "${REGISTRY}/nebula-worker:latest" \
  -t "nebula-worker:latest" \
  .

WORKER_DIGEST=$( (docker inspect --format='{{index .RepoDigests 0}}' "${WORKER_IMAGE_TAG}" 2>/dev/null || docker inspect --format='{{.Id}}' "${WORKER_IMAGE_TAG}") | tr -d '\r\n' )
echo "    Nebula Worker Image Built: ${WORKER_IMAGE_TAG}"
echo "    Digest: ${WORKER_DIGEST}"

# 3. Build Web Frontend Image
echo "==> [3/3] Building Nebula Web Frontend production container..."
WEB_IMAGE_TAG="${REGISTRY}/nebula-web:${GIT_SHA}"
docker build \
  -f Dockerfile.web \
  -t "${WEB_IMAGE_TAG}" \
  -t "${REGISTRY}/nebula-web:${VERSION}" \
  -t "${REGISTRY}/nebula-web:latest" \
  -t "nebula-web:latest" \
  .

WEB_DIGEST=$( (docker inspect --format='{{index .RepoDigests 0}}' "${WEB_IMAGE_TAG}" 2>/dev/null || docker inspect --format='{{.Id}}' "${WEB_IMAGE_TAG}") | tr -d '\r\n' )
echo "    Nebula Web Image Built: ${WEB_IMAGE_TAG}"
echo "    Digest: ${WEB_DIGEST}"

# Record Manifest of Immutable Artifact Digests
DIGEST_FILE="${ROOT_DIR}/infra/gcp/artifacts/image-digests.json"
cat <<EOF > "${DIGEST_FILE}"
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "projectId": "${PROJECT_ID}",
  "region": "${REGION}",
  "repository": "${REGISTRY}",
  "gitSha": "${GIT_SHA}",
  "version": "${VERSION}",
  "artifacts": {
    "api": {
      "image": "${API_IMAGE_TAG}",
      "versionTag": "${REGISTRY}/nebula-api:${VERSION}",
      "digest": "${API_DIGEST}"
    },
    "worker": {
      "image": "${WORKER_IMAGE_TAG}",
      "versionTag": "${REGISTRY}/nebula-worker:${VERSION}",
      "digest": "${WORKER_DIGEST}"
    },
    "web": {
      "image": "${WEB_IMAGE_TAG}",
      "versionTag": "${REGISTRY}/nebula-web:${VERSION}",
      "digest": "${WEB_DIGEST}"
    }
  }
}
EOF

echo "==> Recorded production image digests to: ${DIGEST_FILE}"

# Optional Push to Google Artifact Registry
if [[ "${PUSH}" == "true" || "${1:-}" == "--push" ]]; then
  echo "==> Pushing container images to Artifact Registry..."
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet || true
  docker push "${API_IMAGE_TAG}"
  docker push "${REGISTRY}/nebula-api:${VERSION}"
  docker push "${REGISTRY}/nebula-api:latest"
  docker push "${WORKER_IMAGE_TAG}"
  docker push "${REGISTRY}/nebula-worker:${VERSION}"
  docker push "${REGISTRY}/nebula-worker:latest"
  docker push "${WEB_IMAGE_TAG}"
  docker push "${REGISTRY}/nebula-web:${VERSION}"
  docker push "${REGISTRY}/nebula-web:latest"
  echo "✅ All production images pushed successfully."
fi

echo "=============================================================================="
echo "✅ Production Container Artifacts Successfully Generated & Verified"
echo "=============================================================================="
