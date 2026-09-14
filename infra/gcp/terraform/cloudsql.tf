# Authoritative PostgreSQL Production Persistence on Google Cloud SQL

resource "google_sql_database_instance" "postgres_primary" {
  name             = var.db_instance_name
  database_version = "POSTGRES_17"
  region           = var.region
  project          = var.project_id

  deletion_protection = true

  settings {
    tier              = var.db_tier
    availability_type = "REGIONAL" # High Availability across multiple zones
    disk_type         = "PD_SSD"
    disk_size         = 50
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false # Private IP only: not exposed directly to public internet
      private_network = google_compute_network.nebula_vpc.id
      require_ssl     = true
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 3 # 03:00 UTC
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }
    database_flags {
      name  = "log_disconnections"
      value = "on"
    }
    database_flags {
      name  = "log_lock_waits"
      value = "on"
    }
    database_flags {
      name  = "log_temp_files"
      value = "0"
    }
  }

  depends_on = [
    google_project_service.required_apis,
    google_service_networking_connection.private_vpc_connection,
  ]
}

# Authoritative Nebula Database
resource "google_sql_database" "nebula_database" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres_primary.name
  project  = var.project_id
  charset  = "UTF8"
  collation = "en_US.UTF8"
}

# Authoritative Nebula Database Master User
resource "google_sql_user" "db_admin_user" {
  name     = var.db_user
  instance = google_sql_database_instance.postgres_primary.name
  password = var.db_password
  project  = var.project_id
}
