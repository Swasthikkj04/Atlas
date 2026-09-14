variable "project_id" {
  description = "The Google Cloud Project ID for dedicated production environment"
  type        = string
  default     = "nebula-production"
}

variable "region" {
  description = "The Google Cloud primary production region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment identifier (e.g., production)"
  type        = string
  default     = "production"
}

variable "db_instance_name" {
  description = "Authoritative Cloud SQL PostgreSQL instance name"
  type        = string
  default     = "nebula-prod-postgres"
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-custom-2-7680"
}

variable "db_name" {
  description = "Authoritative database name"
  type        = string
  default     = "atlas"
}

variable "db_user" {
  description = "Database master username"
  type        = string
  default     = "atlas_admin"
}

variable "db_password" {
  description = "Database master password (passed via secret/env)"
  type        = string
  sensitive   = true
}

variable "api_image" {
  description = "Immutable Docker image for API"
  type        = string
  default     = "us-central1-docker.pkg.dev/nebula-production/nebula-docker-repo/nebula-api:latest"
}

variable "worker_image" {
  description = "Immutable Docker image for Background Worker"
  type        = string
  default     = "us-central1-docker.pkg.dev/nebula-production/nebula-docker-repo/nebula-worker:latest"
}

variable "web_image" {
  description = "Immutable Docker image for Frontend SPA"
  type        = string
  default     = "us-central1-docker.pkg.dev/nebula-production/nebula-docker-repo/nebula-web:latest"
}

variable "jwt_access_secret" {
  description = "High-entropy JWT access secret (>=32 chars)"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "High-entropy JWT refresh secret (>=32 chars, distinct from access secret)"
  type        = string
  sensitive   = true
}

variable "frontend_domain" {
  description = "Production custom domain for frontend"
  type        = string
  default     = "https://app.argonion.com"
}
