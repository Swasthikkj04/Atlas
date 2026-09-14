# Least-Privilege IAM Foundation for Nebula Production

# 1. API Service Account
resource "google_service_account" "api_sa" {
  account_id   = "nebula-prod-api-sa"
  display_name = "Nebula Production API Runtime Service Account"
  description  = "Dedicated identity for NestJS API with least-privilege access"
  project      = var.project_id
}

# 2. Worker Service Account
resource "google_service_account" "worker_sa" {
  account_id   = "nebula-prod-worker-sa"
  display_name = "Nebula Production Worker Runtime Service Account"
  description  = "Dedicated identity for Background Understanding Worker"
  project      = var.project_id
}

# 3. CI/CD & Deployer Service Account
resource "google_service_account" "deployer_sa" {
  account_id   = "nebula-prod-deployer-sa"
  display_name = "Nebula Production Deployment Service Account"
  description  = "Identity for CI/CD pipeline and automated deployments"
  project      = var.project_id
}

# IAM Role Bindings for API Service Account (Least Privilege)
locals {
  api_roles = [
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ]
}

resource "google_project_iam_member" "api_roles" {
  for_each = toset(locals.api_roles)
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.api_sa.email}"
}

# IAM Role Bindings for Worker Service Account (Least Privilege)
locals {
  worker_roles = [
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ]
}

resource "google_project_iam_member" "worker_roles" {
  for_each = toset(locals.worker_roles)
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.worker_sa.email}"
}

# IAM Role Bindings for Deployer Service Account
locals {
  deployer_roles = [
    "roles/run.admin",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountUser",
    "roles/cloudsql.client",
  ]
}

resource "google_project_iam_member" "deployer_roles" {
  for_each = toset(locals.deployer_roles)
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.deployer_sa.email}"
}
