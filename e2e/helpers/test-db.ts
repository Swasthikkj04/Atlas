import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const argon2 = require('../../apps/api/node_modules/argon2');
const { PrismaClient } = require('../../apps/api/node_modules/@prisma/client');

export const prisma = new PrismaClient();

export interface TestUserOptions {
  email?: string;
  password?: string;
  fullName?: string;
}

export async function createTestUser(options: TestUserOptions = {}) {
  const email = options.email || `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@example.com`;
  const password = options.password || 'Password123!';
  const fullName = options.fullName || 'E2E Test User';

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  return {
    user,
    email,
    password,
    fullName,
  };
}

export async function createTestDomain(userId: string, domainName: string) {
  return prisma.domain.create({
    data: {
      userId,
      domainName,
      monitoringEnabled: true,
      understandingStatus: 'IDLE',
      lastUnderstoodAt: new Date(),
    },
  });
}

export async function seedDomainWithSnapshotAndFindings(params: {
  domainId: string;
  findingsCount?: number;
  statusCode?: number;
  serverBanner?: string;
}) {
  const { domainId, findingsCount = 2, statusCode = 200, serverBanner = 'nginx/1.24.0' } = params;

  // 1. Create completed job
  const job = await prisma.understandingJob.create({
    data: {
      domainId,
      status: 'COMPLETED',
      trigger: 'INITIAL',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(),
      durationMs: 1200,
    },
  });

  // 2. Create snapshot
  const snapshot = await prisma.infrastructureSnapshot.create({
    data: {
      domainId,
      jobId: job.id,
      httpStatus: statusCode,
      responseTimeMs: 120,
      payload: {
        domain: 'example.com',
        http: {
          statusCode,
          responseTimeMs: 120,
          headers: {
            'content-type': 'text/html; charset=UTF-8',
            'server': serverBanner,
          },
        },
        dns: {
          records: [
            { type: 'A', value: '93.184.216.34', ttl: 300 },
          ],
        },
        tls: {
          valid: true,
          issuer: 'Let\'s Encrypt Authority X3',
          daysRemaining: 45,
        },
      },
    },
  });

  // 3. Create brief
  await prisma.infrastructureBrief.create({
    data: {
      snapshotId: snapshot.id,
      overallHealth: 'HEALTHY',
      summary: 'Perimeter analysis verified 1 edge server and active TLS.',
      highlights: ['Valid TLS certificate', `${serverBanner} detected`],
      recommendations: ['Configure CSP header', 'Enable HSTS header'],
    },
  });

  // 4. Create findings
  const createdFindings = [];
  if (findingsCount > 0) {
    const f1 = await prisma.infrastructureFinding.create({
      data: {
        snapshotId: snapshot.id,
        ruleId: 'HTTP_MISSING_CSP',
        module: 'HTTP',
        category: 'SECURITY_HEADER',
        severity: 'HIGH',
        title: 'Missing Content-Security-Policy Header',
        description: 'The application does not declare a Content-Security-Policy header restricting resource origins.',
      },
    });
    createdFindings.push(f1);
  }

  if (findingsCount > 1) {
    const f2 = await prisma.infrastructureFinding.create({
      data: {
        snapshotId: snapshot.id,
        ruleId: 'HTTP_MISSING_HSTS',
        module: 'HTTP',
        category: 'SECURITY_HEADER',
        severity: 'MEDIUM',
        title: 'Missing Strict-Transport-Security Header',
        description: 'The application does not enforce HTTPS connections via HSTS.',
      },
    });
    createdFindings.push(f2);
  }

  return {
    job,
    snapshot,
    findings: createdFindings,
  };
}

export async function createTestChangeHistory(params: {
  domainId: string;
  previousSnapshotId: string;
  currentSnapshotId: string;
  category?: 'SECURITY_HEADER' | 'TLS' | 'DNS_RECORD';
  changeType?: 'ADDED' | 'REMOVED' | 'MODIFIED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title?: string;
  description?: string;
}) {
  const {
    domainId,
    previousSnapshotId,
    currentSnapshotId,
    category = 'SECURITY_HEADER',
    changeType = 'MODIFIED',
    severity = 'HIGH',
    title = 'Content-Security-Policy improved',
    description = 'Added strict object-src and script-src directives.',
  } = params;

  return prisma.changeHistory.create({
    data: {
      domainId,
      previousSnapshotId,
      currentSnapshotId,
      module: 'HTTP',
      category,
      changeType,
      severity,
      title,
      description,
    },
  });
}

export async function cleanupTestUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (err) {
    // Graceful cleanup
  }
}

export async function createDeactivatedTestUser(options: TestUserOptions = {}) {
  const email = options.email || `deactivated-${Date.now()}@example.com`;
  const password = options.password || 'Password123!';
  const fullName = options.fullName || 'Deactivated User';
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      status: 'DEACTIVATED',
      emailVerifiedAt: new Date(),
    },
  });

  return { user, email, password, fullName };
}

export async function createDeletedTestUser(options: TestUserOptions = {}) {
  const email = options.email || `deleted-${Date.now()}@example.com`;
  const password = options.password || 'Password123!';
  const fullName = options.fullName || 'Deleted User';
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      status: 'DELETED',
      emailVerifiedAt: new Date(),
    },
  });

  return { user, email, password, fullName };
}

export async function createFailedJob(domainId: string, errorMessage = 'DNS lookup timeout: SERVFAIL') {
  return prisma.understandingJob.create({
    data: {
      domainId,
      status: 'FAILED',
      trigger: 'MANUAL',
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(),
      errorMessage,
      attemptCount: 3,
      durationMs: 5000,
    },
  });
}
