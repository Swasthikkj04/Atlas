# Production Cloud Run Services: API, Background Worker, and Web Frontend

# 1. Nebula API Service (NestJS)
resource "google_cloud_run_v2_service" "api_service" {
  name     = "nebula-prod-api"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    vpc_access {
      connector = google_vpc_access_connector.serverless_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.api_image

      resources {
        limits = {
          cpu    = "1000m"
          memory = "1024Mi"
        }
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "8080"
      }
      env {
        name  = "WORKER_ENABLED"
        value = "false"
      }
      env {
        name  = "FRONTEND_URL"
        value = var.frontend_domain
      }
      env {
        name  = "CORS_ALLOWED_ORIGINS"
        value = var.frontend_domain
      }
      env {
        name  = "RATE_LIMIT_ENABLED"
        value = "true"
      }
      env {
        name  = "EMAIL_PROVIDER"
        value = "resend"
      }

      # Runtime Secret Injections from Google Secret Manager
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["DATABASE_URL"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "JWT_ACCESS_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["JWT_ACCESS_SECRET"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "JWT_REFRESH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["JWT_REFRESH_SECRET"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "RESEND_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["RESEND_API_KEY"].secret_id
            version = "latest"
          }
        }
      }

      liveness_probe {
        http_get {
          path = "/api/v1/health/live"
          port = 8080
        }
        initial_delay_seconds = 10
        period_seconds        = 15
        failure_threshold     = 3
      }

      startup_probe {
        http_get {
          path = "/api/v1/health/live"
          port = 8080
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 6
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_sql_database_instance.postgres_primary,
    google_vpc_access_connector.serverless_connector,
  ]
}

# 2. Nebula Understanding Worker Service (Dedicated Background Execution)
resource "google_cloud_run_v2_service" "worker_service" {
  name     = "nebula-prod-worker"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY" # No public direct HTTP ingress

  template {
    service_account = google_service_account.worker_sa.email

    annotations = {
      "run.googleapis.com/cpu-throttling" = "false" # CPU always allocated for background job execution
    }

    scaling {
      min_instance_count = 1
      max_instance_count = 3
    }

    vpc_access {
      connector = google_vpc_access_connector.serverless_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.worker_image

      resources {
        limits = {
          cpu    = "2000m"
          memory = "2048Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "WORKER_ENABLED"
        value = "true"
      }
      env {
        name  = "WORKER_MODE"
        value = "standalone"
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secrets["DATABASE_URL"].secret_id
            version = "latest"
          }
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_sql_database_instance.postgres_primary,
    google_vpc_access_connector.serverless_connector,
  ]
}

# 3. Nebula Web Frontend Service (React SPA via Hardened Nginx)
resource "google_cloud_run_v2_service" "web_service" {
  name     = "nebula-prod-web"
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    containers {
      image = var.web_image

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      ports {
        container_port = 8080
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 5
        period_seconds        = 15
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Public Access IAM Policies for API and Web Frontend
resource "google_cloud_run_v2_service_iam_member" "public_api_access" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "public_web_access" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.web_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
