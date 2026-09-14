import * as fs from 'fs';
import * as path from 'path';

describe('GCP-001: Google Cloud Production Foundation & Deployment Architecture Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // AC-01: Dedicated Production GCP Configuration
  describe('AC-01: Dedicated Production GCP Project & Configuration', () => {
    it('should define valid Terraform provider and backend in infra/gcp/terraform/main.tf', () => {
      const mainTfPath = path.join(rootDir, 'infra/gcp/terraform/main.tf');
      expect(fs.existsSync(mainTfPath)).toBe(true);
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toContain('provider "google"');
      expect(content).toContain('backend "gcs"');
    });

    it('should define production variables and defaults in infra/gcp/terraform/variables.tf', () => {
      const varsTfPath = path.join(rootDir, 'infra/gcp/terraform/variables.tf');
      expect(fs.existsSync(varsTfPath)).toBe(true);
      const content = fs.readFileSync(varsTfPath, 'utf8');
      expect(content).toContain('variable "project_id"');
      expect(content).toContain('variable "region"');
      expect(content).toContain('variable "environment"');
      expect(content).toContain('default     = "us-central1"');
    });
  });

  // AC-02: Required Google Cloud APIs Enabled
  describe('AC-02: Required Google Cloud Services & APIs', () => {
    it('should declare all required GCP service APIs', () => {
      const mainTfPath = path.join(rootDir, 'infra/gcp/terraform/main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      const requiredApis = [
        'run.googleapis.com',
        'sqladmin.googleapis.com',
        'artifactregistry.googleapis.com',
        'secretmanager.googleapis.com',
        'vpcaccess.googleapis.com',
        'compute.googleapis.com',
        'cloudbuild.googleapis.com',
        'monitoring.googleapis.com',
        'logging.googleapis.com',
        'servicenetworking.googleapis.com',
      ];

      for (const api of requiredApis) {
        expect(content).toContain(api);
      }
    });
  });

  // AC-03: Production IAM Least-Privilege Model
  describe('AC-03: Production IAM & Least-Privilege Principle', () => {
    it('should define isolated service accounts for API, Worker, and Deployer', () => {
      const iamTfPath = path.join(rootDir, 'infra/gcp/terraform/iam.tf');
      expect(fs.existsSync(iamTfPath)).toBe(true);
      const content = fs.readFileSync(iamTfPath, 'utf8');
      expect(content).toContain('nebula-prod-api-sa');
      expect(content).toContain('nebula-prod-worker-sa');
      expect(content).toContain('nebula-prod-deployer-sa');
    });

    it('should NOT grant broad Owner or Editor roles to runtime service accounts', () => {
      const iamTfPath = path.join(rootDir, 'infra/gcp/terraform/iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');
      expect(content).not.toContain('roles/owner');
      expect(content).not.toContain('roles/editor');
    });

    it('should bind explicit least-privilege roles to runtime accounts', () => {
      const iamTfPath = path.join(rootDir, 'infra/gcp/terraform/iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');
      expect(content).toContain('roles/cloudsql.client');
      expect(content).toContain('roles/secretmanager.secretAccessor');
      expect(content).toContain('roles/logging.logWriter');
      expect(content).toContain('roles/monitoring.metricWriter');
    });
  });

  // AC-04 & AC-05: Containerization & Artifact Registry
  describe('AC-04 & AC-05: Container Build & Artifact Registry', () => {
    it('should define Docker Artifact Registry in us-central1', () => {
      const arTfPath = path.join(
        rootDir,
        'infra/gcp/terraform/artifact_registry.tf',
      );
      expect(fs.existsSync(arTfPath)).toBe(true);
      const content = fs.readFileSync(arTfPath, 'utf8');
      expect(content).toContain('repository_id = "nebula-docker-repo"');
      expect(content).toContain('format        = "DOCKER"');
    });

    it('should have multi-stage Dockerfiles for API, Worker, and Web Frontend', () => {
      const apiDocker = fs.readFileSync(
        path.join(rootDir, 'Dockerfile.api'),
        'utf8',
      );
      const workerDocker = fs.readFileSync(
        path.join(rootDir, 'Dockerfile.worker'),
        'utf8',
      );
      const webDocker = fs.readFileSync(
        path.join(rootDir, 'Dockerfile.web'),
        'utf8',
      );

      expect(apiDocker).toContain('FROM node:24-alpine AS builder');
      expect(apiDocker).toContain('FROM node:24-alpine AS runner');
      expect(apiDocker).toContain('USER node');
      expect(apiDocker).toContain('EXPOSE 8080');

      expect(workerDocker).toContain('FROM node:24-alpine AS builder');
      expect(workerDocker).toContain('FROM node:24-alpine AS runner');
      expect(workerDocker).toContain('USER node');
      expect(workerDocker).toContain('WORKER_MODE=standalone');

      expect(webDocker).toContain('FROM node:24-alpine AS builder');
      expect(webDocker).toContain('FROM nginx:1.27-alpine AS runner');
      expect(webDocker).toContain('EXPOSE 8080');
    });

    it('should configure hardened Nginx with security headers and SPA routing', () => {
      const nginxConfPath = path.join(rootDir, 'docker/nginx.conf');
      expect(fs.existsSync(nginxConfPath)).toBe(true);
      const content = fs.readFileSync(nginxConfPath, 'utf8');
      expect(content).toContain('listen 8080;');
      expect(content).toContain('X-Frame-Options "SAMEORIGIN"');
      expect(content).toContain('X-Content-Type-Options "nosniff"');
      expect(content).toContain('Content-Security-Policy');
      expect(content).toContain('try_files $uri $uri/ /index.html;');
      expect(content).toContain('gzip on;');
    });

    it('should record deterministic container image digests in image-digests.json', () => {
      const digestsPath = path.join(
        rootDir,
        'infra/gcp/artifacts/image-digests.json',
      );
      expect(fs.existsSync(digestsPath)).toBe(true);
      const digests = JSON.parse(fs.readFileSync(digestsPath, 'utf8'));
      expect(digests.artifacts.api.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(digests.artifacts.worker.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(digests.artifacts.web.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  // AC-06: Cloud SQL PostgreSQL 17 Persistence
  describe('AC-06: Authoritative Cloud SQL PostgreSQL 17 Persistence', () => {
    it('should configure PostgreSQL 17 Regional HA with automated PITR', () => {
      const sqlTfPath = path.join(rootDir, 'infra/gcp/terraform/cloudsql.tf');
      expect(fs.existsSync(sqlTfPath)).toBe(true);
      const content = fs.readFileSync(sqlTfPath, 'utf8');
      expect(content).toContain('database_version = "POSTGRES_17"');
      expect(content).toContain('availability_type = "REGIONAL"');
      expect(content).toContain('deletion_protection = true');
      expect(content).toContain('point_in_time_recovery_enabled = true');
      expect(content).toContain('ipv4_enabled    = false');
    });

    it('should define authoritative database and master user', () => {
      const sqlTfPath = path.join(rootDir, 'infra/gcp/terraform/cloudsql.tf');
      const content = fs.readFileSync(sqlTfPath, 'utf8');
      expect(content).toContain(
        'resource "google_sql_database" "nebula_database"',
      );
      expect(content).toContain('resource "google_sql_user" "db_admin_user"');
    });
  });

  // AC-07 & AC-08: Prisma Schema & Migration Strategy
  describe('AC-07 & AC-08: Prisma Schema & Deterministic Migrations', () => {
    it('should have PostgreSQL datasource in Prisma schema', () => {
      const schemaPath = path.join(rootDir, 'apps/api/prisma/schema.prisma');
      const content = fs.readFileSync(schemaPath, 'utf8');
      expect(content).toContain('provider = "postgresql"');
    });

    it('should have migration runner script configured', () => {
      const migrationScript = path.join(
        rootDir,
        'infra/gcp/scripts/run-database-migrations.sh',
      );
      expect(fs.existsSync(migrationScript)).toBe(true);
      const content = fs.readFileSync(migrationScript, 'utf8');
      expect(content).toContain('prisma migrate deploy');
      expect(content).toContain('prisma migrate status');
    });
  });

  // AC-09: Secret Externalization
  describe('AC-09: Production Secrets Externalization', () => {
    it('should exclude .env and key files in .dockerignore', () => {
      const dockerignore = fs.readFileSync(
        path.join(rootDir, '.dockerignore'),
        'utf8',
      );
      expect(dockerignore).toContain('.env');
      expect(dockerignore).toContain('.env.*');
      expect(dockerignore).toContain('*.key');
      expect(dockerignore).toContain('*.pem');
    });

    it('should define Secret Manager secrets in Terraform', () => {
      const secretTfPath = path.join(
        rootDir,
        'infra/gcp/terraform/secret_manager.tf',
      );
      expect(fs.existsSync(secretTfPath)).toBe(true);
      const content = fs.readFileSync(secretTfPath, 'utf8');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('JWT_ACCESS_SECRET');
      expect(content).toContain('JWT_REFRESH_SECRET');
      expect(content).toContain('RESEND_API_KEY');
    });
  });

  // AC-10: API vs Worker Execution Boundaries
  describe('AC-10: API vs Worker Runtime Separation', () => {
    it('should have dedicated standalone worker entrypoint in apps/api/src/worker.ts', () => {
      const workerTsPath = path.join(rootDir, 'apps/api/src/worker.ts');
      expect(fs.existsSync(workerTsPath)).toBe(true);
      const content = fs.readFileSync(workerTsPath, 'utf8');
      expect(content).toContain('NestFactory.createApplicationContext');
      expect(content).toContain('UnderstandingWorker');
    });

    it('should configure WORKER_ENABLED=false on API and WORKER_ENABLED=true on Worker', () => {
      const apiDocker = fs.readFileSync(
        path.join(rootDir, 'Dockerfile.api'),
        'utf8',
      );
      const workerDocker = fs.readFileSync(
        path.join(rootDir, 'Dockerfile.worker'),
        'utf8',
      );
      expect(apiDocker).toContain('WORKER_ENABLED=false');
      expect(workerDocker).toContain('WORKER_ENABLED=true');
    });
  });

  // AC-11: Absence of Development Dependencies
  describe('AC-11: Production Topology Purity', () => {
    it('should not contain localhost, SQLite, or Mailpit in production Terraform resources', () => {
      const cloudRunTf = fs.readFileSync(
        path.join(rootDir, 'infra/gcp/terraform/cloud_run.tf'),
        'utf8',
      );
      expect(cloudRunTf).not.toContain('localhost');
      expect(cloudRunTf).not.toContain('mailpit');
      expect(cloudRunTf).not.toContain('sqlite');
    });
  });

  // AC-12: Network Security & Ingress Boundaries
  describe('AC-12: Network Boundaries & Ingress Rules', () => {
    it('should configure Serverless VPC Access connector and internal ingress for worker', () => {
      const vpcTf = fs.readFileSync(
        path.join(rootDir, 'infra/gcp/terraform/vpc.tf'),
        'utf8',
      );
      const cloudRunTf = fs.readFileSync(
        path.join(rootDir, 'infra/gcp/terraform/cloud_run.tf'),
        'utf8',
      );

      expect(vpcTf).toContain('google_vpc_access_connector');
      expect(vpcTf).toContain('10.8.0.0/28');
      expect(cloudRunTf).toContain('INGRESS_TRAFFIC_INTERNAL_ONLY');
    });
  });

  // AC-13: Production Documentation
  describe('AC-13: Authoritative Documentation', () => {
    it('should have complete documentation in docs/production/gcp-production-foundation.md', () => {
      const docPath = path.join(
        rootDir,
        'docs/production/gcp-production-foundation.md',
      );
      expect(fs.existsSync(docPath)).toBe(true);
      const content = fs.readFileSync(docPath, 'utf8');
      expect(content).toContain(
        'Google Cloud Production Foundation & Deployment Architecture',
      );
      expect(content).toContain('nebula-production');
      expect(content).toContain('Least-Privilege Security Model');
      expect(content).toContain('Cloud SQL PostgreSQL 17');
    });
  });

  // AC-14: Verification Scripts
  describe('AC-14: Automation & Verification Scripts', () => {
    it('should provide complete executable deployment scripts in infra/gcp/scripts', () => {
      const scripts = [
        'init-gcp-project.sh',
        'build-and-push-images.sh',
        'deploy-cloud-sql.sh',
        'run-database-migrations.sh',
        'deploy-services.sh',
        'verify-production-foundation.sh',
      ];

      for (const script of scripts) {
        const scriptPath = path.join(rootDir, 'infra/gcp/scripts', script);
        expect(fs.existsSync(scriptPath)).toBe(true);
      }
    });
  });

  // AC-15: Domain Contract Non-Regression
  describe('AC-15: Core Domain & Workspace Truth Non-Regression', () => {
    it('should maintain existing health endpoints', () => {
      const healthControllerPath = path.join(
        rootDir,
        'apps/api/src/modules/health/health.controller.ts',
      );
      const content = fs.readFileSync(healthControllerPath, 'utf8');
      expect(content).toContain('getLiveness');
      expect(content).toContain('getReadiness');
      expect(content).toContain('getHealth');
    });
  });
});
