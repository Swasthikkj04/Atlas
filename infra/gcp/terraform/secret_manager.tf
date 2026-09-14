# Production Secrets Management via Google Cloud Secret Manager

locals {
  production_secrets = [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "GOOGLE_CLIENT_SECRET",
    "GITHUB_CLIENT_SECRET",
    "SMTP_PASS",
    "RESEND_API_KEY",
  ]
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(locals.production_secrets)
  secret_id = "nebula-prod-${lower(replace(each.key, "_", "-"))}"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    product     = "nebula"
  }

  depends_on = [google_project_service.required_apis]
}

# Secret Versions (Initialized with configuration or placeholders for external management)
resource "google_secret_manager_secret_version" "db_url" {
  secret      = google_secret_manager_secret.secrets["DATABASE_URL"].id
  secret_data = "postgresql://${var.db_user}:${var.db_password}@/${var.db_name}?host=/cloudsql/${google_sql_database_instance.postgres_primary.connection_name}"
}

resource "google_secret_manager_secret_version" "jwt_access" {
  secret      = google_secret_manager_secret.secrets["JWT_ACCESS_SECRET"].id
  secret_data = var.jwt_access_secret
}

resource "google_secret_manager_secret_version" "jwt_refresh" {
  secret      = google_secret_manager_secret.secrets["JWT_REFRESH_SECRET"].id
  secret_data = var.jwt_refresh_secret
}

# Secret Access Permissions for API Service Account
resource "google_secret_manager_secret_iam_member" "api_secret_access" {
  for_each  = toset(locals.production_secrets)
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_sa.email}"
  project   = var.project_id
}

# Secret Access Permissions for Worker Service Account
resource "google_secret_manager_secret_iam_member" "worker_secret_access" {
  for_each  = toset(locals.production_secrets)
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.worker_sa.email}"
  project   = var.project_id
}
