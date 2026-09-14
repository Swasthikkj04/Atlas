# GCP Project Bootstrap Runbook

**Product**: Nebula Intelligence Platform (under Argonion)  
**Approved Project ID**: `argonion-nebula-prod` per [OD-06](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-06-gcp-project--billing-ownership)  
**Project & Billing Owner**: Swasthik K J (`swasthik@argonion.com`)  
**Document Status**: **READY FOR PROVISIONING EXECUTION (GATES CLOSED VIA PROD-001)**  
**Approved Region**: `asia-south1` (Mumbai, India) per [OD-04](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-04-google-cloud-production-region)  
**Last Updated**: 2026-09-12  

---

## 1. Prerequisites & Preparation Gate

All prerequisites are confirmed and approved:
* [x] Product Owner has confirmed the GCP Account and Billing identity: Swasthik K J ([OD-06](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-06-gcp-project--billing-ownership)).
* [x] Target region verified and approved: `asia-south1` ([OD-04](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-04-google-cloud-production-region)).
* [x] Database sizing and availability approved: Tier 2 `db-custom-1-3840` (`ZONAL`) ([OD-05](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-05-cloud-sql-initial-sizing--availability)).
* [x] Google Cloud SDK (`gcloud` CLI) is available locally.
* [x] Active Billing Account is available with Google Cloud $300 Free Trial credits.

---

## 2. Project Creation & Organization Setup

```bash
# 1. Set environment variables for bootstrap session
export GCP_PROJECT_ID="argonion-nebula-prod"
export GCP_PROJECT_NAME="Argonion Nebula Production"
export GCP_BILLING_ACCOUNT_ID="YOUR_BILLING_ACCOUNT_ID" # Replace with active billing account ID
export GCP_REGION="asia-south1" # Approved primary region

# 2. Create the Google Cloud Project
gcloud projects create "${GCP_PROJECT_ID}" \
  --name="${GCP_PROJECT_NAME}" \
  --set-as-default

# 3. Link the Billing Account to the Project
gcloud billing projects link "${GCP_PROJECT_ID}" \
  --billing-account="${GCP_BILLING_ACCOUNT_ID}"
```

---

## 3. Budget Alert & Cost Control Configuration

To prevent runaway spend and safeguard the $300 Free Trial credits:

```bash
# Configure budget threshold alert at $250 with notifications at 50%, 80%, and 100%
gcloud billing budgets create \
  --billing-account="${GCP_BILLING_ACCOUNT_ID}" \
  --display-name="Nebula Production Free Trial Safety Budget" \
  --budget-amount=250.00USD \
  --threshold-rule=percent=0.50,basis=current-spend \
  --threshold-rule=percent=0.80,basis=current-spend \
  --threshold-rule=percent=1.00,basis=current-spend \
  --filter-projects="projects/${GCP_PROJECT_ID}"
```

---

## 4. Required Service API Enablement

Enable all required Google Cloud APIs:

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  --project="${GCP_PROJECT_ID}"
```

---

## 5. Regional Architecture: `asia-south1` (Mumbai, India)

Per [ADR-PROD-004](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/decisions/ADR-PROD-004-DEPLOYMENT-REGION.md) and [OD-04](file:///home/swasthik-k-j/Desktop/Atlas/docs/production/OWNER-DECISIONS.md#od-04-google-cloud-production-region), `asia-south1` is the **APPROVED** production region.

### Regional Verification Summary
1. **Cloud Run Gen2**: Verified supported in `asia-south1`.
2. **Cloud SQL PostgreSQL 17**: Verified supported on Tier 2 (`db-custom-1-3840`).
3. **Serverless VPC Access**: Verified supported (`10.8.0.0/28`).
4. **Artifact Registry**: Regional Docker repository supported.

If unexpected regional capacity issues occur during initial creation, fallback to `us-central1` is documented as the secondary option.

---

## 6. Service Account & Least-Privilege IAM Architecture

Create dedicated service accounts for each workload boundary. **Zero shared service accounts and zero `roles/owner` or `roles/editor` grants are permitted.**

```bash
# 1. Backend API Service Account
gcloud iam service-accounts create nebula-prod-api-sa \
  --display-name="Nebula Production API Runtime SA" \
  --project="${GCP_PROJECT_ID}"

# 2. Background Worker Service Account
gcloud iam service-accounts create nebula-prod-worker-sa \
  --display-name="Nebula Production Worker Runtime SA" \
  --project="${GCP_PROJECT_ID}"

# 3. CI/CD Deployer Service Account (for GitHub Actions)
gcloud iam service-accounts create nebula-prod-deployer-sa \
  --display-name="Nebula Production Deployer SA" \
  --project="${GCP_PROJECT_ID}"

# 4. Database Migration Service Account
gcloud iam service-accounts create nebula-prod-migration-sa \
  --display-name="Nebula Production DB Migration SA" \
  --project="${GCP_PROJECT_ID}"
```

### IAM Role Bindings

```bash
# Bind API Runtime Roles
gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-api-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-api-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-api-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/vpcaccess.user"

# Bind Worker Runtime Roles
gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-worker-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-worker-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-worker-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/vpcaccess.user"

# Bind Deployer CI/CD Roles
gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-deployer-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-deployer-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:nebula-prod-deployer-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

## 7. Artifact Registry Setup

Create a centralized Docker repository in Google Artifact Registry in `asia-south1`:

```bash
gcloud artifacts repositories create nebula-docker-repo \
  --repository-format=docker \
  --location="${GCP_REGION}" \
  --description="Nebula Production Container Repository" \
  --project="${GCP_PROJECT_ID}"
```

Docker image naming format:
* API: `${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/nebula-docker-repo/nebula-api:latest`
* Worker: `${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/nebula-docker-repo/nebula-worker:latest`
* Web: `${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/nebula-docker-repo/nebula-web:latest`

---

## 8. Deletion Protection & Disaster Recovery Considerations

1. **Project Deletion Lien**:
   Prevent accidental project deletion by applying a project lien:
   ```bash
   gcloud resource-manager liens create \
     --restrictions="resourcemanager.projects.delete" \
     --reason="Production protection for Nebula platform" \
     --project="${GCP_PROJECT_ID}"
   ```
2. **Cloud SQL Deletion Protection**:
   All database instances must have `deletion_protection = true` enabled in Terraform.
3. **Backup Retention**:
   Automated daily database backups retained for 7 days with WAL logs for Point-in-Time Recovery.
4. **Disaster Recovery**:
   Infrastructure definitions are versioned in `infra/gcp/terraform/` to permit full recreation in an alternative region within 60 minutes if regional failure occurs.
