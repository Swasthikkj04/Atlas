terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "nebula-production-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Core Google Cloud APIs Required for Nebula Production
locals {
  required_services = [
    "run.googleapis.com",                # Cloud Run Admin API
    "sqladmin.googleapis.com",           # Cloud SQL Admin API
    "artifactregistry.googleapis.com",   # Artifact Registry API
    "secretmanager.googleapis.com",      # Secret Manager API
    "vpcaccess.googleapis.com",          # Serverless VPC Access API
    "compute.googleapis.com",            # Compute Engine API (Networking/VPC)
    "cloudbuild.googleapis.com",         # Cloud Build API
    "monitoring.googleapis.com",         # Cloud Monitoring API
    "logging.googleapis.com",            # Cloud Logging API
    "servicenetworking.googleapis.com",  # Service Networking API (Private Service Connect)
  ]
}

resource "google_project_service" "required_apis" {
  for_each                   = toset(locals.required_services)
  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}
