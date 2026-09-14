# Artifact Registry Foundation for Nebula Production Images

resource "google_artifact_registry_repository" "nebula_repo" {
  provider      = google-beta
  project       = var.project_id
  location      = var.region
  repository_id = "nebula-docker-repo"
  description   = "Authoritative container image repository for Nebula Production artifacts"
  format        = "DOCKER"

  docker_config {
    immutable_tags = false # Allows immutable SHA tags and semantic tags
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    product     = "nebula"
  }

  depends_on = [google_project_service.required_apis]
}
