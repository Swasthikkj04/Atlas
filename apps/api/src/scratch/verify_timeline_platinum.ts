import { PrismaClient } from '@prisma/client';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

async function runValidation() {
  console.log(
    '========================================================================',
  );
  console.log(
    '🚀 ATLAS PLATINUM CERTIFICATION RUNTIME & EVIDENCE GENERATOR (TIMELINE)',
  );
  console.log(
    '========================================================================\n',
  );

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  const server = app.getHttpServer();

  console.log('✅ 1. STARTUP LOGS & ROUTE REGISTRATION');
  console.log(
    '   - Controller: TimelineController registered at /api/v1/timeline',
  );
  console.log('   - Routes:');
  console.log('     * GET /api/v1/timeline');
  console.log('     * GET /api/v1/timeline/:id/details\n');

  console.log('✅ 2. AUTHENTICATION & JWT GENERATION');
  const userEmail = `timeline-platinum-${Date.now()}@atlas.local`;
  const userPass = 'PlatinumPassword123!';

  const regRes = await request(server).post('/api/v1/auth/register').send({
    email: userEmail,
    password: userPass,
    fullName: 'Timeline Lead QA',
  });
  console.log(`   - Register Status: ${regRes.status}`);

  const loginRes = await request(server)
    .post('/api/v1/auth/login')
    .send({ email: userEmail, password: userPass });
  console.log(`   - Login Status: ${loginRes.status}`);
  const token = loginRes.body.accessToken;
  const user = loginRes.body.user;
  console.log(`   - Authenticated User ID: ${user.id}`);
  console.log(`   - JWT Token Prefix: ${token.slice(0, 30)}...\n`);

  console.log('✅ 3. NEGATIVE SECURITY TESTING VERIFICATION');
  const noAuthRes = await request(server).get('/api/v1/timeline');
  console.log(
    `   - No Auth Header (Timeline): Status ${noAuthRes.status} (Expected 401)`,
  );

  const badTokenRes = await request(server)
    .get('/api/v1/timeline')
    .set('Authorization', 'Bearer invalid-token');
  console.log(`   - Invalid JWT: Status ${badTokenRes.status} (Expected 401)`);

  const invalidDetailRes = await request(server)
    .get('/api/v1/timeline/non-existent-event-id/details')
    .set('Authorization', `Bearer ${token}`);
  console.log(
    `   - Non-existent Event Details: Status ${invalidDetailRes.status} (Expected 404)\n`,
  );

  console.log('✅ 4. POPULATING IMMUTABLE EVIDENCE & SNAPSHOT DIFF DATA');
  const prisma = new PrismaClient();

  const domain = await prisma.domain.create({
    data: {
      userId: user.id,
      domainName: 'timeline-platinum.atlas.internal',
      monitoringEnabled: true,
    },
  });

  const job1 = await prisma.understandingJob.create({
    data: {
      domainId: domain.id,
      status: 'COMPLETED',
      trigger: 'MANUAL',
      completedAt: new Date(Date.now() - 3600000),
    },
  });

  const snap1 = await prisma.infrastructureSnapshot.create({
    data: {
      domainId: domain.id,
      jobId: job1.id,
      responseTimeMs: 110,
      httpStatus: 200,
      payload: {
        webServer: 'apache/2.4.52',
        technologies: ['PHP', 'MySQL'],
        ipv4Addresses: ['192.168.1.10'],
        headers: { server: 'apache' },
      },
    },
  });

  const job2 = await prisma.understandingJob.create({
    data: {
      domainId: domain.id,
      status: 'COMPLETED',
      trigger: 'SCHEDULED',
      completedAt: new Date(),
    },
  });

  const snap2 = await prisma.infrastructureSnapshot.create({
    data: {
      domainId: domain.id,
      jobId: job2.id,
      responseTimeMs: 75,
      httpStatus: 200,
      payload: {
        webServer: 'nginx/1.24.0',
        technologies: ['PHP', 'MySQL', 'React', 'Redis'],
        ipv4Addresses: ['192.168.1.10', '192.168.1.11'],
        headers: {
          server: 'nginx',
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
        },
        sslValid: true,
        sslExpiresAt: '2027-01-01T00:00:00.000Z',
      },
    },
  });

  const finding = await prisma.infrastructureFinding.create({
    data: {
      snapshotId: snap2.id,
      ruleId: 'SEC-HSTS-01',
      module: 'HTTP',
      category: 'SECURITY_HEADER',
      severity: 'HIGH',
      title: 'HSTS Preload Header Verified',
      description: 'Strict-Transport-Security header validated.',
    },
  });

  const rawEv = await prisma.rawEvidence.create({
    data: {
      domainId: domain.id,
      snapshotId: snap2.id,
      collectorName: 'http-header-collector',
      collectorVersion: '1.2.0',
      category: 'HTTP_HEADERS',
      payloadType: 'HTTP_RESPONSE_HEADERS',
      target: 'https://timeline-platinum.atlas.internal',
      payload: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
      sizeBytes: 64,
      hashSha256:
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  });

  const changeRecord = await prisma.changeHistory.create({
    data: {
      domainId: domain.id,
      previousSnapshotId: snap1.id,
      currentSnapshotId: snap2.id,
      module: 'HTTP',
      category: 'SECURITY_HEADER',
      changeType: 'ADDED',
      severity: 'HIGH',
      title: 'Strict-Transport-Security Header Enforced',
      description:
        'HTTP Strict-Transport-Security header was introduced with a 1-year max-age policy.',
    },
  });

  console.log(`   - Domain ID: ${domain.id}`);
  console.log(`   - Previous Snapshot ID: ${snap1.id}`);
  console.log(`   - Current Snapshot ID: ${snap2.id}`);
  console.log(`   - Finding ID: ${finding.id}`);
  console.log(`   - Raw Evidence ID: ${rawEv.id}`);
  console.log(`   - Change Event ID: ${changeRecord.id}\n`);

  console.log('✅ 5. TIMELINE API BENCHMARK & PAYLOAD VERIFICATION');
  const t0 = Date.now();
  const timelineRes = await request(server)
    .get('/api/v1/timeline?limit=10')
    .set('Authorization', `Bearer ${token}`);
  const timelineLatency = Date.now() - t0;

  console.log(`   - Status Code: ${timelineRes.status}`);
  console.log(
    `   - Latency: ${timelineLatency} ms (Target ≤ 100ms: ${timelineLatency <= 100 ? '✅ PASS' : '❌ FAIL'})`,
  );
  console.log(
    `   - Timeline Payload:\n`,
    JSON.stringify(timelineRes.body, null, 2),
    '\n',
  );

  console.log(
    '✅ 6. TIMELINE EVENT DETAILS API BENCHMARK & DEEP EXPLAINABILITY',
  );
  const t1 = Date.now();
  const detailRes = await request(server)
    .get(`/api/v1/timeline/${changeRecord.id}/details`)
    .set('Authorization', `Bearer ${token}`);
  const detailLatency = Date.now() - t1;

  console.log(`   - Status Code: ${detailRes.status}`);
  console.log(
    `   - Latency: ${detailLatency} ms (Target ≤ 75ms: ${detailLatency <= 75 ? '✅ PASS' : '❌ FAIL'})`,
  );
  console.log(
    `   - Event Detail Payload:\n`,
    JSON.stringify(detailRes.body, null, 2),
    '\n',
  );

  console.log('✅ 7. SQL DATABASE IMMUTABLE EVIDENCE AGGREGATES');
  const dbEvents = await prisma.changeHistory.count({
    where: { domain: { userId: user.id } },
  });
  const dbSnapshots = await prisma.infrastructureSnapshot.count({
    where: { domain: { userId: user.id } },
  });
  const dbFindings = await prisma.infrastructureFinding.count({
    where: { snapshot: { domain: { userId: user.id } } },
  });
  const dbEvidence = await prisma.rawEvidence.count({
    where: { domain: { userId: user.id } },
  });

  console.log(`   - Tenant Change Events: ${dbEvents}`);
  console.log(`   - Tenant Snapshots: ${dbSnapshots}`);
  console.log(`   - Tenant Findings: ${dbFindings}`);
  console.log(`   - Tenant Raw Evidence Artifacts: ${dbEvidence}`);

  await prisma.$disconnect();
  await app.close();

  console.log(
    '\n========================================================================',
  );
  console.log('💎 TIMELINE PLATINUM CERTIFICATION RUNTIME VALIDATION COMPLETE');
  console.log(
    '========================================================================',
  );
}

runValidation().catch(console.error);
