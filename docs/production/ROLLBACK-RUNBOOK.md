# Production Rollback Runbook

**Product**: Nebula Intelligence Platform (under Argonion)  
**Target Environment**: Google Cloud Platform (GCP)  
**Document Version**: 2.0.0  

---

## 1. Incident Classification & Rollback Decision Matrix

When an incident occurs post-deployment, use this matrix to select the appropriate rollback procedure:

| Incident Severity | Symptoms | Trigger Condition | Recommended Rollback Action |
|---|---|---|---|
| **P0 — Critical Outage** | API returning 500/503 errors; health probe failing; web frontend crash | Immediate post-deploy degradation | **Action 1**: Instant Cloud Run traffic shift to previous healthy revision (< 30 seconds). |
| **P1 — Functional Regression** | Critical user flow broken (auth, workspace, finding generation); worker crash loop | Post-smoke test discovery | **Action 2**: Rollback via GitHub Actions Workflow Dispatch or CLI for API & Worker. |
| **P0 — Corrupted Database State** | Data loss or destructive schema modification | Fatal migration issue | **Action 3**: Cloud SQL Point-in-Time Recovery (PITR) to pre-deployment timestamp. |
| **P2 — Edge / DNS Misconfiguration** | SSL handshake errors; Cloudflare 52x errors; CORS errors | DNS / Header misconfiguration | **Action 4**: Cloudflare edge rule / SSL mode revert. |

---

## 2. Action 1: Instant Cloud Run Traffic Rollback (< 30 Seconds)

Google Cloud Run stores immutable revision history. Traffic can be shifted back to the previous healthy revision with zero downtime.

```mermaid
flowchart LR
    Browser["Client Traffic"] --> Cloudflare["Cloudflare Edge"]
    Cloudflare -->|100% Traffic| RevGood["Healthy Revision (v1.0.0)"]
    Cloudflare -.->|0% Traffic (Reverted)| RevBad["Faulty Revision (v1.0.1)"]
```

### 1. Identify the Previous Healthy Revision

```bash
# Set GCP Environment
export GCP_PROJECT_ID="nebula-production"
export GCP_REGION="us-central1"

# List recent revisions
gcloud run revisions list --service=nebula-prod-api --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}" --limit=3
gcloud run revisions list --service=nebula-prod-web --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}" --limit=3
```

### 2. Shift 100% Traffic Back to Healthy Revision

```bash
# Shift API traffic
PREV_API_REV=$(gcloud run revisions list --service=nebula-prod-api --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}" --format='value(name)' --limit=2 | tail -n1)
echo "==> Rolling back API to revision: ${PREV_API_REV}"
gcloud run services update-traffic nebula-prod-api \
  --to-revisions="${PREV_API_REV}=100" \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT_ID}"

# Shift Web frontend traffic
PREV_WEB_REV=$(gcloud run revisions list --service=nebula-prod-web --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}" --format='value(name)' --limit=2 | tail -n1)
echo "==> Rolling back Web to revision: ${PREV_WEB_REV}"
gcloud run services update-traffic nebula-prod-web \
  --to-revisions="${PREV_WEB_REV}=100" \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT_ID}"
```

---

## 3. Action 2: Rollback via GitHub Actions Workflow Dispatch

If using CI/CD automation:
1. Navigate to **GitHub Actions** → **Production CD & Release Pipeline**.
2. Click **Run workflow** (branch: `main`).
3. Fill in the rollback parameters:
   - **`rollback_target`**: Enter the target Cloud Run revision name (e.g. `nebula-prod-api-00004-abc`).
   - **`skip_migrations`**: Check `true` (do not run forward migrations during rollback).
4. Click **Run workflow**.
5. The pipeline executes the `plan` and `deploy` rollback jobs, safely shifting traffic back to the target revision and verifying health probes.

---

## 4. Worker Service Rollback & Queue Safety

The background worker (`nebula-prod-worker`) does not receive public HTTP traffic, so traffic-shifting does not apply. To roll back the worker:

```bash
# 1. Fetch previous worker image or revision image
PREV_WORKER_IMG=$(gcloud run revisions describe "${PREV_WORKER_REV}" --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}" --format='value(spec.containers[0].image)')

# 2. Re-deploy worker with previous known-good image
gcloud run deploy nebula-prod-worker \
  --image="${PREV_WORKER_IMG}" \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT_ID}" \
  --quiet
```

> [!NOTE]
> **Graceful Queue Draining**: `nebula-prod-worker` listens to `SIGTERM` and will finish active in-flight understanding tasks before exiting. Avoid `kill -9` or hard termination.

---

## 5. Action 3: Database Rollback & Point-in-Time Recovery (PITR)

### Backward-Compatible Migration Rule
All Prisma migrations in Nebula are designed to be **backward-compatible** (expanding columns or adding tables without immediately dropping active columns). If application traffic is rolled back to an earlier revision, the database schema usually does not need to be rolled back.

### When Database Restoration is Unavoidable (PITR):
If an accidental data deletion or destructive migration occurred:

```bash
# 1. Clone the database instance to an exact minute prior to the failure
RESTORE_TIME="2026-09-12T16:00:00Z"
RESTORED_INSTANCE="nebula-prod-postgres-restored"

echo "==> Restoring Cloud SQL to point-in-time: ${RESTORE_TIME}..."
gcloud sql instances clone "${DB_INSTANCE_NAME}" "${RESTORED_INSTANCE}" \
  --point-in-time="${RESTORE_TIME}" \
  --project="${GCP_PROJECT_ID}"

# 2. Update DATABASE_URL secret in Secret Manager to point to restored instance
RESTORED_CONNECTION="${GCP_PROJECT_ID}:${GCP_REGION}:${RESTORED_INSTANCE}"
RESTORED_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${RESTORED_CONNECTION}"

echo -n "${RESTORED_DATABASE_URL}" | gcloud secrets versions add "nebula-prod-database-url" \
  --data-file=- \
  --project="${GCP_PROJECT_ID}"

# 3. Redeploy API and Worker to pick up latest secret version
gcloud run services update nebula-prod-api --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}"
gcloud run services update nebula-prod-worker --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}"
```

---

## 6. Action 4: Edge / Cloudflare Rollback

If issues stem from Cloudflare settings (e.g. SSL loop, overly aggressive WAF rule):
1. **SSL/TLS Mode**: Check Cloudflare SSL/TLS mode. If set to *Flexible*, set to **Full (Strict)** to resolve redirect loops.
2. **Page Rules / WAF Rules**: Disable recently added WAF custom rules or rate limiting rules that might be falsely blocking legitimate traffic.
3. **Under Attack Mode**: Disable *Under Attack Mode* if causing friction for legitimate API/SPA clients.
4. **Purge Cache**: In Cloudflare dashboard → **Caching** → **Configuration** → **Purge Everything** to clear stale cached HTML/JS bundles.

---

## 7. Post-Rollback Health Verification Checklist

After executing a rollback, verify all services:

* [ ] `curl -s https://api.argonion.com/api/v1/health/live` returns HTTP 200 `{"status":"ok"}`
* [ ] `curl -s https://api.argonion.com/api/v1/health/ready` returns HTTP 200 `{"status":"ready"}`
* [ ] `curl -s -I https://app.argonion.com` returns HTTP 200 with valid headers
* [ ] Cloud Run Console shows 100% traffic directed to the healthy revision
* [ ] Cloud Logging shows no recurring unhandled exceptions
* [ ] Post-incident review ticket created to document root cause
