# Google Cloud Production Foundation Outputs

output "project_id" {
  description = "The Google Cloud Project ID"
  value       = var.project_id
}

output "region" {
  description = "The Google Cloud production region"
  value       = var.region
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository ID"
  value       = google_artifact_registry_repository.nebula_repo.name
}

output "artifact_registry_endpoint" {
  description = "Artifact Registry Docker registry endpoint"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.nebula_repo.repository_id}"
}

output "cloud_sql_instance_name" {
  description = "Authoritative Cloud SQL PostgreSQL instance name"
  value       = google_sql_database_instance.postgres_primary.name
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name for Cloud Run and proxy attachments"
  value       = google_sql_database_instance.postgres_primary.connection_name
}

output "cloud_sql_private_ip" {
  description = "Private IP address of the Cloud SQL PostgreSQL instance"
  value       = google_sql_database_instance.postgres_primary.private_ip_address
}

output "api_service_url" {
  description = "Cloud Run service URL for Nebula API"
  value       = google_cloud_run_v2_service.api_service.uri
}

output "web_service_url" {
  description = "Cloud Run service URL for Nebula Web Frontend"
  value       = google_cloud_run_v2_service.web_service.uri
}

output "api_service_account_email" {
  description = "Service account email for API runtime"
  value       = google_service_account.api_sa.email
}

output "worker_service_account_email" {
  description = "Service account email for Worker runtime"
  value       = google_service_account.worker_sa.email
}

output "deployer_service_account_email" {
  description = "Service account email for CI/CD deployer"
  value       = google_service_account.deployer_sa.email
}
