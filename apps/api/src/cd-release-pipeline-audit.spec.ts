import * as fs from 'fs';
import * as path from 'path';

describe('TKT-003: Production CD & Release Pipeline Invariants Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const deployWorkflowPath = path.join(rootDir, '.github/workflows/deploy.yml');
  const ciWorkflowPath = path.join(rootDir, '.github/workflows/ci.yml');

  let deployYaml: string;
  let ciYaml: string;

  beforeAll(() => {
    expect(fs.existsSync(deployWorkflowPath)).toBe(true);
    expect(fs.existsSync(ciWorkflowPath)).toBe(true);
    deployYaml = fs.readFileSync(deployWorkflowPath, 'utf8');
    ciYaml = fs.readFileSync(ciWorkflowPath, 'utf8');
  });

  describe('CD-01: Trigger Policy & CI Gate Dependency', () => {
    it('should trigger only after CI Quality Pipeline completes on main or via workflow_dispatch', () => {
      expect(deployYaml).toContain('workflow_run:');
      expect(deployYaml).toContain('CI Quality Pipeline');
      expect(deployYaml).toContain('workflow_dispatch:');
      expect(deployYaml).toContain("workflow_run.conclusion == 'success'");
      expect(deployYaml).toContain("workflow_run.head_branch == 'main'");
    });

    it('should enforce serialized release concurrency to prevent deployment races', () => {
      expect(deployYaml).toContain('group: production-release');
      expect(deployYaml).toContain('cancel-in-progress: false');
    });
  });

  describe('CD-02: Container Build & Immutable Image Provenance', () => {
    it('should build all three production containers using existing Dockerfiles', () => {
      expect(deployYaml).toContain('Dockerfile.api');
      expect(deployYaml).toContain('Dockerfile.worker');
      expect(deployYaml).toContain('Dockerfile.web');
    });

    it('should tag container images with immutable commit SHA', () => {
      expect(deployYaml).toContain('github.sha');
      expect(deployYaml).toContain('nebula-api');
      expect(deployYaml).toContain('nebula-worker');
      expect(deployYaml).toContain('nebula-web');
      expect(deployYaml).toContain('image-digests.json');
    });
  });

  describe('CD-03: Production Database Migration Safety', () => {
    it('should execute prisma migrate deploy and never destructive commands', () => {
      expect(deployYaml).toContain('prisma migrate deploy');
      expect(deployYaml).toContain('prisma migrate status');
      expect(deployYaml).not.toContain('prisma migrate dev');
      expect(deployYaml).not.toContain('prisma migrate reset');
      expect(deployYaml).not.toContain('prisma db push');
    });
  });

  describe('CD-04: Cloud Run Release & Secret Manager Integration', () => {
    it('should deploy to Cloud Run services preserving VPC connector and Cloud SQL attachments', () => {
      expect(deployYaml).toContain('gcloud run deploy nebula-prod-api');
      expect(deployYaml).toContain('gcloud run deploy nebula-prod-worker');
      expect(deployYaml).toContain('gcloud run deploy nebula-prod-web');
      expect(deployYaml).toContain('--vpc-connector');
      expect(deployYaml).toContain('--add-cloudsql-instances');
    });

    it('should inject secrets from Google Secret Manager rather than exposing in plaintext', () => {
      expect(deployYaml).toContain(
        'DATABASE_URL=nebula-prod-database-url:latest',
      );
      expect(deployYaml).toContain(
        'JWT_ACCESS_SECRET=nebula-prod-jwt-access-secret:latest',
      );
      expect(deployYaml).toContain(
        'JWT_REFRESH_SECRET=nebula-prod-jwt-refresh-secret:latest',
      );
      expect(deployYaml).toContain(
        'RESEND_API_KEY=nebula-prod-resend-api-key:latest',
      );
      expect(deployYaml).toContain('EMAIL_PROVIDER=resend');
    });

    it('should assign dedicated runtime service accounts', () => {
      expect(deployYaml).toContain('nebula-prod-api-sa');
      expect(deployYaml).toContain('nebula-prod-worker-sa');
      expect(deployYaml).toContain('nebula-prod-deployer-sa');
    });
  });

  describe('CD-05: Health & Smoke Verification', () => {
    it('should verify live and ready health probes on API', () => {
      expect(deployYaml).toContain('/api/v1/health/live');
      expect(deployYaml).toContain('/api/v1/health/ready');
      expect(deployYaml).toContain('/health');
    });

    it('should perform post-deployment smoke verification', () => {
      expect(deployYaml).toContain('/api/v1/workspace/overview');
    });
  });

  describe('CD-06: Rollback & Recovery Mechanisms', () => {
    it('should capture previous active revisions and support automated rollback on verification failure', () => {
      expect(deployYaml).toContain('latestReadyRevisionName');
      expect(deployYaml).toContain('rollback-on-failure');
      expect(deployYaml).toContain('update-traffic');
      expect(deployYaml).toContain('--to-revisions=');
    });

    it('should support manual emergency rollback via workflow_dispatch input', () => {
      expect(deployYaml).toContain('rollback_target');
      expect(deployYaml).toContain('is_rollback');
    });
  });

  describe('CD-07: Manual Tooling Preservation', () => {
    it('should preserve manual operational scripts in infra/gcp/scripts/', () => {
      const requiredScripts = [
        'build-and-push-images.sh',
        'deploy-services.sh',
        'run-database-migrations.sh',
        'verify-production-foundation.sh',
      ];

      for (const script of requiredScripts) {
        const fullPath = path.join(rootDir, 'infra/gcp/scripts', script);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    });
  });
});
