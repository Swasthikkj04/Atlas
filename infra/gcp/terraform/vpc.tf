# Production VPC & Private Service Networking

resource "google_compute_network" "nebula_vpc" {
  name                    = "nebula-prod-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id
  description             = "Dedicated production VPC network for Nebula"

  depends_on = [google_project_service.required_apis]
}

resource "google_compute_subnetwork" "nebula_subnet" {
  name          = "nebula-prod-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.nebula_vpc.id
  project       = var.project_id

  private_ip_google_access = true
}

# Reserved Internal IP Range for Cloud SQL Private Services Access
resource "google_compute_global_address" "private_ip_alloc" {
  name          = "nebula-prod-sql-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.nebula_vpc.id
  project       = var.project_id
}

# Private VPC Peering Connection for Cloud SQL
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.nebula_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
}

# Serverless VPC Access Connector for Cloud Run to access Cloud SQL privately
resource "google_vpc_access_connector" "serverless_connector" {
  name          = "nebula-vpc-conn"
  region        = var.region
  project       = var.project_id
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.nebula_vpc.name
  min_instances = 2
  max_instances = 3
  machine_type  = "e2-micro"

  depends_on = [
    google_project_service.required_apis,
    google_compute_network.nebula_vpc,
  ]
}
