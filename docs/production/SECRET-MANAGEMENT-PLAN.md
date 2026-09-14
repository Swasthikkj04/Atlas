# Secret Management & Anti-Leakage Plan

**Product**: Nebula Intelligence Platform (under Argonion)  
**Secret Store**: Google Secret Manager (GCP Project: `argonion-nebula-prod`)  
**Document Status**: **READY FOR SECRET PROVISIONING (GATES CLOSED VIA PROD-001)**  
**Security Standard**: S-01 (Security Boundaries), S-02 (Authentication & Sessions), S-10 (Supply Chain Integrity)  
**Last Updated**: 2026-09-12  

---

## 1. Secret Classification & Production Inventory

Every production credential, token, and cryptographic key is categorized in the inventory below:

| Secret Identifier | Secret Manager Name | Target Consumer(s) | Description & Requirements | Minimum Entropy |
| :--- | :--- | :--- | :--- | :--- |
| **Database URL** | `nebula-db-url` | `nebula-prod-api`<br>`nebula-prod-worker`<br>`nebula-prod-migration-sa` | Private PostgreSQL connection string (`postgresql://atlas_prod_user:SECRET@10.8.0.3:5432/atlas_prod?sslmode=require`) | 32+ char password |
| **JWT Access Secret** | `nebula-jwt-access-secret` | `nebula-prod-api` | Secret key used to sign and verify short-lived access tokens (15-min TTL). | 256-bit (64 hex chars) |
| **JWT Refresh Secret** | `nebula-jwt-refresh-secret` | `nebula-prod-api` | Secret key used to sign stateful refresh tokens (7-day TTL). | 256-bit (64 hex chars) |
| **Google Client Secret** | `nebula-google-client-secret` | `nebula-prod-api` | OAuth 2.0 Client Secret issued by Google Cloud Console for user authentication. | Provider-issued |
| **GitHub Client Secret** | `nebula-github-client-secret` | `nebula-prod-api` | OAuth 2.0 Client Secret issued by GitHub Developer Settings. | Provider-issued |
| **Resend API Key** | `nebula-resend-api-key` | `nebula-prod-api` | Transactional email dispatch key (`re_...`) issued by Resend Console. | Provider-issued |
| **Token Hash Pepper** | `nebula-token-pepper` | `nebula-prod-api` | Cryptographic pepper for hashing verification tokens and session identifiers. | 256-bit (64 hex chars) |

---

## 2. Anti-Leakage Invariants & Hardened Boundaries

To maintain 100% security boundary integrity, the following rules are enforced by CI/CD linters and automated tests:

1. **Zero Secret Git Commit**: No production API keys, connection strings, or private tokens may be committed to any branch in GitHub.
2. **Frontend Isolation (`VITE_*`)**:
   - Frontend web assets (`nebula-prod-web`) receive only non-sensitive public configuration (e.g., `VITE_API_URL=https://api.argonion.com/api/v1`, `VITE_APP_URL=https://nebula.argonion.com`).
   - Secret Manager secrets, database URLs, JWT keys, and OAuth client secrets are **strictly forbidden** in `VITE_*` environment variables.
3. **No Build-Time Secret Baking**:
   - Container images built in GitHub Actions (`Dockerfile.api`, `Dockerfile.web`, `Dockerfile.worker`) contain zero credentials or environment files.
   - All runtime variables are injected at container startup via Cloud Run Secret Manager bindings.
4. **CI/CD Log Sanitization**:
   - Deployment workflows use GitHub Secrets masked with `***`.
   - Error formatters in NestJS (`ResendEmailProvider`, `StructuredLogger`) automatically redact API keys and sensitive tokens before logging.

---

## 3. Secret Provisioning in Google Secret Manager

Run these commands during Phase 9 of the provisioning sequence:

```bash
export GCP_PROJECT_ID="argonion-nebula-prod"

# 1. Create Secret Containers in Secret Manager
gcloud secrets create nebula-db-url --replication-policy="automatic" --project="${GCP_PROJECT_ID}"
gcloud secrets create nebula-jwt-access-secret --replication-policy="automatic" --project="${GCP_PROJECT_ID}"
gcloud secrets create nebula-jwt-refresh-secret --replication-policy="automatic" --project="${GCP_PROJECT_ID}"
gcloud secrets create nebula-google-client-secret --replication-policy="automatic" --project="${GCP_PROJECT_ID}"
gcloud secrets create nebula-github-client-secret --replication-policy="automatic" --project="${GCP_PROJECT_ID}"
gcloud secrets create nebula-resend-api-key --replication-policy="automatic" --project="${GCP_PROJECT_ID}"
gcloud secrets create nebula-token-pepper --replication-policy="automatic" --project="${GCP_PROJECT_ID}"

# 2. Add High-Entropy Versions (Example via secure stdin)
echo -n "postgresql://atlas_prod_user:SECURE_PASS@10.8.0.3:5432/atlas_prod?sslmode=require" | \
  gcloud secrets versions add nebula-db-url --data-file=- --project="${GCP_PROJECT_ID}"

openssl rand -hex 32 | \
  gcloud secrets versions add nebula-jwt-access-secret --data-file=- --project="${GCP_PROJECT_ID}"

openssl rand -hex 32 | \
  gcloud secrets versions add nebula-jwt-refresh-secret --data-file=- --project="${GCP_PROJECT_ID}"

openssl rand -hex 32 | \
  gcloud secrets versions add nebula-token-pepper --data-file=- --project="${GCP_PROJECT_ID}"
```

---

## 4. Cloud Run Secret Mounting Configuration

Secrets are mounted as environment variables directly in Cloud Run service definitions:

```bash
# Cloud Run API Secret Mounts
gcloud run services update nebula-prod-api \
  --set-secrets="DATABASE_URL=nebula-db-url:latest,\
JWT_ACCESS_SECRET=nebula-jwt-access-secret:latest,\
JWT_REFRESH_SECRET=nebula-jwt-refresh-secret:latest,\
GOOGLE_CLIENT_SECRET=nebula-google-client-secret:latest,\
GITHUB_CLIENT_SECRET=nebula-github-client-secret:latest,\
RESEND_API_KEY=nebula-resend-api-key:latest,\
TOKEN_HASH_PEPPER=nebula-token-pepper:latest" \
  --region=asia-south1 \
  --project="${GCP_PROJECT_ID}"

# Cloud Run Worker Secret Mounts
gcloud run services update nebula-prod-worker \
  --set-secrets="DATABASE_URL=nebula-db-url:latest,\
TOKEN_HASH_PEPPER=nebula-token-pepper:latest" \
  --region=asia-south1 \
  --project="${GCP_PROJECT_ID}"
```

---

## 5. Secret Rotation Runbook

### JWT Secret Rotation (Zero-Downtime)
1. Add new secret version in Secret Manager:
   ```bash
   openssl rand -hex 32 | gcloud secrets versions add nebula-jwt-access-secret --data-file=-
   ```
2. Redeploy `nebula-prod-api`. Existing refresh tokens remain valid through database session validation (`sessionService.rotateSession`).

### Resend API Key Rotation
1. Generate a new API key in the Resend Dashboard.
2. Add the new key version to Secret Manager:
   ```bash
   echo -n "re_NEW_KEY_HERE" | gcloud secrets versions add nebula-resend-api-key --data-file=-
   ```
3. Update `nebula-prod-api` service revision.
4. Verify transactional email dispatch via `POST /api/v1/auth/resend-verification`.
5. Revoke the old API key in the Resend Dashboard.
