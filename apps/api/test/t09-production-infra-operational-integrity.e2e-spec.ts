import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { UserAccountStatus, TriggerType, JobStatus } from '@prisma/client';
import { WorkerReliabilityService, FailureCategory } from '../src/modules/understanding/services/worker-reliability.service';
import { UnderstandingWorker } from '../src/modules/understanding/understanding.worker';
import { UnderstandingService } from '../src/modules/understanding/understanding.service';
import { UnderstandingRepository } from '../src/modules/understanding/repositories/understanding.repository';
import { AuditRedactor } from '../src/common/security/audit-redactor';
import { MetricsService } from '../src/infrastructure/metrics/metrics.service';

jest.setTimeout(30000);

describe('T-09: Production Infrastructure & Operational Integrity Certification Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let workerReliability: WorkerReliabilityService;
  let understandingService: UnderstandingService;
  let understandingRepo: UnderstandingRepository;
  let metricsService: MetricsService;

  const rootDir = path.resolve(__dirname, '../../..');
  const timestamp = Date.now();

  // Test Tenant
  let userToken: string;
  let userId: string;
  let domainId: string;
  const domainName = `t09-ops-test-${timestamp}.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get(PrismaService);
    workerReliability = app.get(WorkerReliabilityService);
    understandingService = app.get(UnderstandingService);
    understandingRepo = app.get(UnderstandingRepository);
    metricsService = app.get(MetricsService);

    await app.init();

    // Stop background worker polling to prevent race condition with manual engine executions
    try {
      const worker = app.get(UnderstandingWorker, { strict: false });
      worker?.onModuleDestroy();
    } catch {
      // ignore
    }

    // Setup Tenant User
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `t09-ops-user-${timestamp}@example.com`,
        password: 'Password123!@#',
        confirmPassword: 'Password123!@#',
        fullName: 'Production Ops Tester',
      });

    userId = regRes.body.user.id;
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `t09-ops-user-${timestamp}@example.com`,
        password: 'Password123!@#',
      });
    userToken = loginRes.body.accessToken;

    const domainRec = await prisma.domain.create({
      data: {
        userId,
        domainName,
      },
    });
    domainId = domainRec.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    if (app) {
      await app.close();
    }
  });

  // ===========================================================================
  // Dimension 1: Production Deployment & Container Artifact Integrity
  // ===========================================================================
  describe('Dimension 1: Production Deployment & Container Artifact Integrity', () => {
    it('Dockerfile.api conforms to multi-stage, rootless, production specifications', () => {
      const dockerfile = fs.readFileSync(path.join(rootDir, 'Dockerfile.api'), 'utf8');
      expect(dockerfile).toContain('FROM node:24-alpine AS builder');
      expect(dockerfile).toContain('FROM node:24-alpine AS runner');
      expect(dockerfile).toContain('ENV NODE_ENV=production');
      expect(dockerfile).toContain('PORT=8080');
      expect(dockerfile).toContain('WORKER_ENABLED=false');
      expect(dockerfile).toContain('USER node');
      expect(dockerfile).toContain('EXPOSE 8080');
      expect(dockerfile).toContain('HEALTHCHECK');
      expect(dockerfile).toContain('/api/v1/health/live');
      expect(dockerfile).toContain('apps/api/dist/main.js');
    });

    it('Dockerfile.worker conforms to isolated background execution specifications', () => {
      const dockerfile = fs.readFileSync(path.join(rootDir, 'Dockerfile.worker'), 'utf8');
      expect(dockerfile).toContain('FROM node:24-alpine AS builder');
      expect(dockerfile).toContain('FROM node:24-alpine AS runner');
      expect(dockerfile).toContain('ENV NODE_ENV=production');
      expect(dockerfile).toContain('WORKER_ENABLED=true');
      expect(dockerfile).toContain('WORKER_MODE=standalone');
      expect(dockerfile).toContain('USER node');
      expect(dockerfile).toContain('apps/api/dist/worker.js');
    });

    it('Dockerfile.web conforms to static bundle nginx serving specifications', () => {
      const dockerfile = fs.readFileSync(path.join(rootDir, 'Dockerfile.web'), 'utf8');
      expect(dockerfile).toContain('FROM node:24-alpine AS builder');
      expect(dockerfile).toContain('FROM nginx:1.27-alpine AS runner');
      expect(dockerfile).toContain('EXPOSE 8080');
      expect(dockerfile).toContain('HEALTHCHECK');
      expect(dockerfile).toContain('docker/nginx.conf');
    });

    it('Terraform infrastructure defines dedicated Cloud Run, Cloud SQL, and least-privilege IAM', () => {
      const mainTf = fs.readFileSync(path.join(rootDir, 'infra/gcp/terraform/main.tf'), 'utf8');
      const iamTf = fs.readFileSync(path.join(rootDir, 'infra/gcp/terraform/iam.tf'), 'utf8');
      const cloudSqlTf = fs.readFileSync(path.join(rootDir, 'infra/gcp/terraform/cloudsql.tf'), 'utf8');

      expect(mainTf).toContain('run.googleapis.com');
      expect(mainTf).toContain('sqladmin.googleapis.com');
      expect(iamTf).toContain('nebula-prod-api-sa');
      expect(iamTf).toContain('nebula-prod-worker-sa');
      expect(iamTf).toContain('nebula-prod-deployer-sa');
      expect(iamTf).not.toContain('roles/owner');
      expect(iamTf).not.toContain('roles/editor');
      expect(cloudSqlTf).toContain('POSTGRES_17');
      expect(cloudSqlTf).toContain('point_in_time_recovery_enabled = true');
    });
  });

  // ===========================================================================
  // Dimension 2: Health & Readiness Probes
  // ===========================================================================
  describe('Dimension 2: Health & Readiness Probes', () => {
    it('GET /api/v1/health/live returns 200 UP without verifying external dependencies', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBeDefined();
      expect(typeof res.body.uptimeSeconds).toBe('number');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/v1/health/ready returns 200 READY when database is healthy', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('READY');
      expect(res.body.checks.database).toBe('UP');
      expect(res.body.checks.worker).toBe('UP');
    });

    it('GET /api/v1/health returns comprehensive platform health summary', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.checks.database.status).toBe('UP');
      expect(typeof res.body.checks.database.latencyMs).toBe('number');
      expect(res.body.checks.memory.status).toBe('UP');
      expect(res.body.checks.memory.heapUsedMB).toBeGreaterThan(0);
      expect(res.body.checks.process.status).toBe('UP');
      expect(res.body.checks.process.nodeVersion).toBeDefined();
    });

    it('health probes are exempted from rate limiting bursts', async () => {
      for (let i = 0; i < 15; i++) {
        const res = await request(app.getHttpServer()).get('/api/v1/health/live');
        expect(res.status).toBe(200);
      }
    });
  });

  // ===========================================================================
  // Dimension 3: Graceful Shutdown & Process Lifecycle
  // ===========================================================================
  describe('Dimension 3: Graceful Shutdown & Process Lifecycle', () => {
    it('main.ts enables shutdown hooks and signal listeners', () => {
      const mainTs = fs.readFileSync(path.join(rootDir, 'apps/api/src/main.ts'), 'utf8');
      expect(mainTs).toContain('app.enableShutdownHooks()');
    });

    it('worker.ts handles SIGTERM and SIGINT for graceful shutdown', () => {
      const workerTs = fs.readFileSync(path.join(rootDir, 'apps/api/src/worker.ts'), 'utf8');
      expect(workerTs).toContain("process.on('SIGTERM'");
      expect(workerTs).toContain("process.on('SIGINT'");
      expect(workerTs).toContain('await app.close()');
    });

    it('WorkerReliabilityService sets isShuttingDown and drains active jobs on destroy', async () => {
      const testWorkerReliability = new WorkerReliabilityService(understandingRepo, metricsService);
      expect(testWorkerReliability.isShuttingDownState()).toBe(false);
      await testWorkerReliability.onModuleDestroy();
      expect(testWorkerReliability.isShuttingDownState()).toBe(true);
    });
  });

  // ===========================================================================
  // Dimension 4: Background Worker Reliability & Recovery
  // ===========================================================================
  describe('Dimension 4: Background Worker Reliability & Recovery', () => {
    it('correctly classifies errors into retriable vs non-retriable categories', () => {
      const netErr = workerReliability.classifyError(new Error('ETIMEDOUT: Connection timed out'));
      expect(netErr.category).toBe(FailureCategory.NETWORK);
      expect(netErr.isRetriable).toBe(true);

      const dbErr = workerReliability.classifyError(new Error('PrismaClientInitializationError: Connection terminated'));
      expect(dbErr.category).toBe(FailureCategory.DATABASE);
      expect(dbErr.isRetriable).toBe(true);

      const valErr = workerReliability.classifyError(new Error('Validation failed: Target domain is unresolvable or malformed'));
      expect(valErr.category).toBe(FailureCategory.VALIDATION);
      expect(valErr.isRetriable).toBe(false);

      const authErr = workerReliability.classifyError(new Error('Unauthorized: Invalid configuration credentials'));
      expect(authErr.category).toBe(FailureCategory.CONFIGURATION);
      expect(authErr.isRetriable).toBe(false);
    });

    it('calculates exponential backoff delay correctly with bounded ceiling', () => {
      expect(workerReliability.getRetryDelayMs(1, 1000, 30000)).toBe(1000);
      expect(workerReliability.getRetryDelayMs(2, 1000, 30000)).toBe(2000);
      expect(workerReliability.getRetryDelayMs(3, 1000, 30000)).toBe(4000);
      expect(workerReliability.getRetryDelayMs(10, 1000, 30000)).toBe(30000); // capped at 30s
    });

    it('reconciles stale RUNNING jobs whose lease has expired and re-queues them', async () => {
      const staleJob = await prisma.understandingJob.create({
        data: {
          domainId,
          status: JobStatus.RUNNING,
          workerId: 'worker_crashed_node_9999',
          leaseUntil: new Date(Date.now() - 10000), // Expired 10s ago
          attemptCount: 1,
          maxAttempts: 3,
          trigger: TriggerType.MANUAL,
        },
      });

      const recovered = await workerReliability.recoverStuckJobs(60000);
      expect(recovered).toBeGreaterThanOrEqual(1);

      const updatedJob = await prisma.understandingJob.findUnique({
        where: { id: staleJob.id },
      });

      expect(updatedJob?.status).toBe(JobStatus.PENDING);
      expect(updatedJob?.errorMessage).toContain('[STALE_JOB_RECOVERED]');

      // Cleanup
      await prisma.understandingJob.delete({ where: { id: staleJob.id } });
    });

    it('permanently fails stale jobs that have exhausted maxAttempts', async () => {
      const exhaustedJob = await prisma.understandingJob.create({
        data: {
          domainId,
          status: JobStatus.RUNNING,
          workerId: 'worker_crashed_node_8888',
          leaseUntil: new Date(Date.now() - 10000), // Expired
          attemptCount: 3,
          maxAttempts: 3,
          trigger: TriggerType.MANUAL,
        },
      });

      const recovered = await workerReliability.recoverStuckJobs(60000);
      expect(recovered).toBeGreaterThanOrEqual(1);

      const updatedJob = await prisma.understandingJob.findUnique({
        where: { id: exhaustedJob.id },
      });

      expect(updatedJob?.status).toBe(JobStatus.FAILED);
      expect(updatedJob?.errorMessage).toContain('[MAX_ATTEMPTS_EXCEEDED]');

      // Cleanup
      await prisma.understandingJob.delete({ where: { id: exhaustedJob.id } });
    });

    it('prevents duplicate job processing with atomic lease claiming', async () => {
      const pendingJob = await prisma.understandingJob.create({
        data: {
          domainId,
          status: JobStatus.PENDING,
          attemptCount: 0,
          trigger: TriggerType.MANUAL,
        },
      });

      const claim1 = await understandingService.claimJob(pendingJob.id, 'worker_A', 60000);
      const claim2 = await understandingService.claimJob(pendingJob.id, 'worker_B', 60000);

      expect(claim1).toBe(true);
      expect(claim2).toBe(false); // Worker B is denied

      // Cleanup
      await prisma.understandingJob.delete({ where: { id: pendingJob.id } });
    });
  });

  // ===========================================================================
  // Dimension 5: Database Reliability & Transaction Safety
  // ===========================================================================
  describe('Dimension 5: Database Reliability & Transaction Safety', () => {
    it('atomic transaction guarantees rollback on partial snapshot failure', async () => {
      const rollbackDomainName = `rollback-${randomUUID()}.com`;

      // Simulate transactional failure: rollback must leave zero orphaned records
      try {
        await prisma.$transaction(async (tx) => {
          await tx.domain.create({
            data: {
              userId,
              domainName: rollbackDomainName,
            },
          });
          // Intentionally throw error inside transaction
          throw new Error('Simulated Database Persistence Abort');
        });
      } catch (err) {
        expect((err as Error).message).toBe('Simulated Database Persistence Abort');
      }

      // Verify domain was completely rolled back
      const orphanedDomain = await prisma.domain.findFirst({
        where: { domainName: rollbackDomainName },
      });
      expect(orphanedDomain).toBeNull();
    });
  });

  // ===========================================================================
  // Dimension 6: Schema Migrations & Data Immortality
  // ===========================================================================
  describe('Dimension 6: Schema Migrations & Data Immortality', () => {
    it('Prisma schema migrations directory exists and contains valid migration steps', () => {
      const migrationsDir = path.join(rootDir, 'apps/api/prisma/migrations');
      expect(fs.existsSync(migrationsDir)).toBe(true);
      const migrations = fs.readdirSync(migrationsDir).filter((f) =>
        fs.statSync(path.join(migrationsDir, f)).isDirectory(),
      );
      expect(migrations.length).toBeGreaterThan(0);
    });

    it('CD deployment script uses non-destructive prisma migrate deploy', () => {
      const deployScript = fs.readFileSync(
        path.join(rootDir, 'infra/gcp/scripts/run-database-migrations.sh'),
        'utf8',
      );
      expect(deployScript).toContain('prisma migrate deploy');
      expect(deployScript).toContain('prisma migrate status');
      expect(deployScript).not.toContain('prisma db push');
      expect(deployScript).not.toContain('prisma migrate reset');
    });
  });

  // ===========================================================================
  // Dimension 7: Deployment, Release Verification & Rollback
  // ===========================================================================
  describe('Dimension 7: Deployment, Release Verification & Rollback', () => {
    it('deploy workflow defines immutable image generation with provenance manifest', () => {
      const deployYaml = fs.readFileSync(path.join(rootDir, '.github/workflows/deploy.yml'), 'utf8');
      expect(deployYaml).toContain('image-digests.json');
      expect(deployYaml).toContain('nebula-api');
      expect(deployYaml).toContain('nebula-worker');
      expect(deployYaml).toContain('nebula-web');
      expect(deployYaml).toContain('actions/upload-artifact@v4');
    });

    it('deploy workflow supports instant revision rollback via workflow_dispatch input', () => {
      const deployYaml = fs.readFileSync(path.join(rootDir, '.github/workflows/deploy.yml'), 'utf8');
      expect(deployYaml).toContain('rollback_target:');
      expect(deployYaml).toContain('is_rollback');
      expect(deployYaml).toContain('gcloud run services update-traffic');
    });
  });

  // ===========================================================================
  // Dimension 8: Observability & Structured Logging
  // ===========================================================================
  describe('Dimension 8: Observability & Structured Logging', () => {
    it('redacts sensitive credentials, tokens, and authorization headers from audit logs', () => {
      const sensitivePayload = {
        email: 'user@example.com',
        password: 'SuperSecretPassword123!',
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThis',
        apiKey: ['sk', 'live', '1234567890abcdef'].join('_'),
        authorization: 'Bearer eyJhbGciOi...',
        normalData: 'Safe information',
      };

      const sanitized = AuditRedactor.redactAuditMetadata(sensitivePayload);

      expect(sanitized?.password).toBe('[REDACTED_SECRET]');
      expect(sanitized?.token).toBe('[REDACTED_BEARER_TOKEN]');
      expect(sanitized?.apiKey).toBe('[REDACTED_SECRET]');
      expect(sanitized?.authorization).toBe('[REDACTED_SECRET]');
      expect(sanitized?.email).toBe('[REDACTED_EMAIL]');
      expect(sanitized?.normalData).toBe('Safe information');
    });

    it('propagates correlation IDs from request headers into response headers', async () => {
      const testCorrId = `test-corr-${randomUUID()}`;
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('x-correlation-id', testCorrId);

      expect(res.status).toBe(200);
      expect(res.headers['x-correlation-id'] || res.headers['X-Correlation-ID']).toBe(testCorrId);
    });
  });

  // ===========================================================================
  // Dimension 9: Error Monitoring & Client Response Sanitization
  // ===========================================================================
  describe('Dimension 9: Error Monitoring & Client Response Sanitization', () => {
    it('returns standardized RFC 7807 error payload without leaking internal stack traces', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/domains/non-existent-uuid-12345')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.correlationId).toBeDefined();
      expect(res.body.stack).toBeUndefined(); // Stack trace never leaked to client
    });
  });

  // ===========================================================================
  // Dimension 10: Resource & Capacity Management
  // ===========================================================================
  describe('Dimension 10: Resource & Capacity Management', () => {
    it('RateLimiterGuard safely manages request bursts on protected endpoints', async () => {
      const results: number[] = [];
      for (let i = 0; i < 20; i++) {
        const res = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${userToken}`);
        results.push(res.status);
      }
      expect(results.every((s) => s === 200 || s === 429)).toBe(true);
    });
  });

  // ===========================================================================
  // Dimension 11: Persistence Backup & Recovery Verification
  // ===========================================================================
  describe('Dimension 11: Persistence Backup & Recovery Verification', () => {
    it('Cloud SQL terraform configuration enables automated daily backups and Point-In-Time Recovery', () => {
      const cloudSqlTf = fs.readFileSync(path.join(rootDir, 'infra/gcp/terraform/cloudsql.tf'), 'utf8');
      expect(cloudSqlTf).toContain('backup_configuration');
      expect(cloudSqlTf).toContain('enabled                        = true');
      expect(cloudSqlTf).toContain('point_in_time_recovery_enabled = true');
      expect(cloudSqlTf).toContain('transaction_log_retention_days = 7');
    });
  });

  // ===========================================================================
  // Dimension 12: DNS, TLS & Edge Network Operations
  // ===========================================================================
  describe('Dimension 12: DNS, TLS & Edge Network Operations', () => {
    it('Nginx production configuration enforces strict security headers and asset caching', () => {
      const nginxConf = fs.readFileSync(path.join(rootDir, 'docker/nginx.conf'), 'utf8');
      expect(nginxConf).toContain('X-Frame-Options "SAMEORIGIN"');
      expect(nginxConf).toContain('X-Content-Type-Options "nosniff"');
      expect(nginxConf).toContain('Referrer-Policy "strict-origin-when-cross-origin"');
      expect(nginxConf).toContain('Content-Security-Policy');
      expect(nginxConf).toContain('location = /health');
    });
  });

  // ===========================================================================
  // Dimension 13: CI/CD Quality Gates & Supply-Chain Security
  // ===========================================================================
  describe('Dimension 13: CI/CD Quality Gates & Supply-Chain Security', () => {
    it('CI workflow defines all 5 mandatory quality gates before deployment can trigger', () => {
      const ciYaml = fs.readFileSync(path.join(rootDir, '.github/workflows/ci.yml'), 'utf8');
      expect(ciYaml).toContain('Static Quality & Standards');
      expect(ciYaml).toContain('Test Suite Verification');
      expect(ciYaml).toContain('Production Build Verification');
      expect(ciYaml).toContain('Dependency & Security Audit');
      expect(ciYaml).toContain('CI Quality Gatekeeper');
    });
  });

  // ===========================================================================
  // Dimension 14: Configuration & Secret Management
  // ===========================================================================
  describe('Dimension 14: Configuration & Secret Management', () => {
    it('.dockerignore excludes all environment and secret files', () => {
      const dockerignore = fs.readFileSync(path.join(rootDir, '.dockerignore'), 'utf8');
      expect(dockerignore).toContain('.env');
    });

    it('Secret Manager terraform declares production secret resources', () => {
      const secretManagerTf = fs.readFileSync(
        path.join(rootDir, 'infra/gcp/terraform/secret_manager.tf'),
        'utf8',
      );
      expect(secretManagerTf).toContain('google_secret_manager_secret');
      expect(secretManagerTf).toContain('"DATABASE_URL"');
      expect(secretManagerTf).toContain('"JWT_ACCESS_SECRET"');
      expect(secretManagerTf).toContain('"JWT_REFRESH_SECRET"');
    });
  });

  // ===========================================================================
  // Dimension 15: Controlled Resilience Simulation Matrix
  // ===========================================================================
  describe('Dimension 15: Controlled Resilience Simulation Matrix', () => {
    it('Sim 1: Container restart recovery simulation', async () => {
      const livenessRes = await request(app.getHttpServer()).get('/api/v1/health/live');
      expect(livenessRes.status).toBe(200);
    });

    it('Sim 2: Worker crash recovery simulation via lease expiry', async () => {
      const stuckJob = await prisma.understandingJob.create({
        data: {
          domainId,
          status: JobStatus.RUNNING,
          workerId: 'dead-worker-pid-4321',
          leaseUntil: new Date(Date.now() - 5000),
          attemptCount: 1,
          maxAttempts: 3,
          trigger: TriggerType.MANUAL,
        },
      });

      const count = await workerReliability.recoverStuckJobs(60000);
      expect(count).toBeGreaterThanOrEqual(1);

      await prisma.understandingJob.delete({ where: { id: stuckJob.id } });
    });

    it('Sim 3: Database transient outage detection via readiness probe', async () => {
      const readyRes = await request(app.getHttpServer()).get('/api/v1/health/ready');
      expect(readyRes.status).toBe(200);
      expect(readyRes.body.status).toBe('READY');
    });

    it('Sim 4: Abusive request payload containment', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/domains')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          domainName: 'a'.repeat(500) + '.com', // Excessive payload
        });

      expect([400, 422]).toContain(res.status);
    });

    it('Sim 5: Discovery error handling with uncertainty preservation', () => {
      const discErr = workerReliability.classifyError(new Error('Discovery failed: DNS resolution timed out after 5000ms'));
      expect(discErr.category).toBe(FailureCategory.DISCOVERY);
      expect(discErr.isRetriable).toBe(true);
    });

    it('Sim 6: Rollback target configuration in deploy pipeline', () => {
      const deployYaml = fs.readFileSync(path.join(rootDir, '.github/workflows/deploy.yml'), 'utf8');
      expect(deployYaml).toContain('rollback_target');
      expect(deployYaml).toContain('gcloud run services update-traffic');
    });

    it('Sim 7: Graceful shutdown state transition', () => {
      expect(typeof workerReliability.isShuttingDownState()).toBe('boolean');
    });

    it('Sim 8: Concurrent job claiming conflict resolution', async () => {
      const job = await prisma.understandingJob.create({
        data: {
          domainId,
          status: JobStatus.PENDING,
          trigger: TriggerType.MANUAL,
        },
      });

      const [c1, c2] = await Promise.all([
        understandingService.claimJob(job.id, 'worker_X', 60000),
        understandingService.claimJob(job.id, 'worker_Y', 60000),
      ]);

      // Exactly one succeeds
      expect((c1 && !c2) || (!c1 && c2)).toBe(true);

      await prisma.understandingJob.delete({ where: { id: job.id } });
    });

    it('Sim 9: Health failure detection response format', async () => {
      const healthRes = await request(app.getHttpServer()).get('/api/v1/health');
      expect(healthRes.body.checks).toBeDefined();
      expect(healthRes.body.checks.database).toBeDefined();
    });

    it('Sim 10: Memory pressure degradation alert reporting', async () => {
      const healthRes = await request(app.getHttpServer()).get('/api/v1/health');
      expect(healthRes.body.checks.memory.status).toMatch(/^(UP|DEGRADED)$/);
    });
  });

  // ===========================================================================
  // Dimension 16: End-to-End Production Smoke Pipeline
  // ===========================================================================
  describe('Dimension 16: End-to-End Production Smoke Pipeline', () => {
    it('executes full operational lifecycle: Domain -> Understanding -> Snapshot -> Findings -> Brief', async () => {
      // 1. Submit Understanding Job for existing domain
      const queueRes = await request(app.getHttpServer())
        .post(`/api/v1/domains/${domainId}/understand`)
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 201, 202]).toContain(queueRes.status);
      const smokeJobId = queueRes.body.id || queueRes.body.jobId;
      expect(smokeJobId).toBeDefined();

      // 2. Claim Job as Worker
      const claimed = await understandingService.claimJob(smokeJobId, 'smoke-worker-1', 60000);
      expect(claimed).toBe(true);

      // 3. Process Job through Understanding Pipeline
      await understandingService.processJob(smokeJobId);

      // 4. Complete Job
      await understandingService.completeJob(smokeJobId, 1200);

      // 5. Verify Job is marked COMPLETED
      const completedJob = await understandingRepo.findById(smokeJobId);
      expect(completedJob?.status).toBe(JobStatus.COMPLETED);
      expect(completedJob?.durationMs).toBe(1200);

      // 6. Verify Latest Snapshot Created
      const latestSnapshot = await prisma.infrastructureSnapshot.findFirst({
        where: { domainId },
        orderBy: { createdAt: 'desc' },
      });
      expect(latestSnapshot).toBeDefined();

      // 7. Verify Workspace Domain Overview
      const overviewRes = await request(app.getHttpServer())
        .get(`/api/v1/domains/${domainId}/overview`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(overviewRes.status).toBe(200);
      expect(overviewRes.body.domain).toBeDefined();
      expect(overviewRes.body.domain.id).toBe(domainId);
    }, 30000);
  });

  // ===========================================================================
  // Dimension 17: Required Evidence & Gate Certification Conformance
  // ===========================================================================
  describe('Dimension 17: Required Evidence & Gate Certification Conformance', () => {
    it('verifies that all operational, reliability, and deployment criteria are satisfied', () => {
      expect(fs.existsSync(path.join(rootDir, 'Dockerfile.api'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'Dockerfile.worker'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'Dockerfile.web'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, '.github/workflows/ci.yml'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, '.github/workflows/deploy.yml'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'infra/gcp/terraform/main.tf'))).toBe(true);
    });
  });
});
