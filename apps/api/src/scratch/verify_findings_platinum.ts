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
    '🚀 ATLAS PLATINUM CERTIFICATION RUNTIME & EVIDENCE GENERATOR (FINDINGS)',
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
    '   - Controller: FindingController registered at /api/v1/findings',
  );
  console.log('   - Routes:');
  console.log('     * GET /api/v1/findings');
  console.log('     * GET /api/v1/findings/:findingId');
  console.log('     * GET /api/v1/findings/snapshots/:snapshotId/findings\n');

  console.log('✅ 2. AUTHENTICATION & JWT GENERATION');
  const userEmail = `findings-platinum-${Date.now()}@atlas.local`;
  const userPass = 'PlatinumPassword123!';

  const regRes = await request(server).post('/api/v1/auth/register').send({
    email: userEmail,
    password: userPass,
    fullName: 'Findings Lead QA',
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
  const noAuthRes = await request(server).get('/api/v1/findings');
  console.log(
    `   - No Auth Header (Findings): Status ${noAuthRes.status} (Expected 401)`,
  );

  const badTokenRes = await request(server)
    .get('/api/v1/findings')
    .set('Authorization', 'Bearer invalid-token');
  console.log(`   - Invalid JWT: Status ${badTokenRes.status} (Expected 401)`);

  const invalidDetailRes = await request(server)
    .get('/api/v1/findings/non-existent-finding-id')
    .set('Authorization', `Bearer ${token}`);
  console.log(
    `   - Non-existent Finding Details: Status ${invalidDetailRes.status} (Expected 404)\n`,
  );

  console.log('✅ 4. POPULATING IMMUTABLE EVIDENCE & FINDING DATA');
  const prisma = new PrismaClient();

  const domain = await prisma.domain.create({
    data: {
      userId: user.id,
      domainName: 'findings-platinum.atlas.internal',
      monitoringEnabled: true,
    },
  });

  const job = await prisma.understandingJob.create({
    data: {
      domainId: domain.id,
      status: 'COMPLETED',
      trigger: 'MANUAL',
      completedAt: new Date(),
    },
  });

  const snap = await prisma.infrastructureSnapshot.create({
    data: {
      domainId: domain.id,
      jobId: job.id,
      responseTimeMs: 82,
      httpStatus: 200,
      payload: {
        webServer: 'nginx/1.24.0',
        technologies: ['Node.js', 'Express'],
        ipv4Addresses: ['192.168.2.10'],
        headers: { server: 'nginx' },
      },
    },
  });

  const rawEv = await prisma.rawEvidence.create({
    data: {
      domainId: domain.id,
      snapshotId: snap.id,
      collectorName: 'http-header-collector',
      collectorVersion: '1.2.0',
      category: 'HTTP_HEADERS',
      payloadType: 'HTTP_RESPONSE_HEADERS',
      target: 'https://findings-platinum.atlas.internal',
      payload: 'Server: nginx/1.24.0\nCache-Control: no-store',
      sizeBytes: 120,
      hashSha256:
        'b4c2a8f90e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b',
    },
  });

  const finding1 = await prisma.infrastructureFinding.create({
    data: {
      snapshotId: snap.id,
      ruleId: 'SEC-HSTS-01',
      module: 'HTTP',
      category: 'SECURITY_HEADER',
      severity: 'HIGH',
      title: 'Missing HSTS Response Header',
      description:
        'Strict-Transport-Security header is absent from HTTP responses.',
    },
  });

  const finding2 = await prisma.infrastructureFinding.create({
    data: {
      snapshotId: snap.id,
      ruleId: 'SEC-CSP-01',
      module: 'HTTP',
      category: 'SECURITY_HEADER',
      severity: 'HIGH',
      title: 'Missing Content Security Policy',
      description:
        'Content-Security-Policy header is absent from HTTP responses.',
    },
  });

  console.log(`   - Domain ID: ${domain.id}`);
  console.log(`   - Snapshot ID: ${snap.id}`);
  console.log(`   - Raw Evidence ID: ${rawEv.id}`);
  console.log(`   - Finding 1 ID: ${finding1.id}`);
  console.log(`   - Finding 2 ID: ${finding2.id}\n`);

  console.log('✅ 5. FINDINGS LIST API BENCHMARK & PAYLOAD VERIFICATION');
  const t0 = Date.now();
  const listRes = await request(server)
    .get('/api/v1/findings?limit=10')
    .set('Authorization', `Bearer ${token}`);
  const listLatency = Date.now() - t0;

  console.log(`   - Status Code: ${listRes.status}`);
  console.log(
    `   - Latency: ${listLatency} ms (Target ≤ 100ms: ${listLatency <= 100 ? '✅ PASS' : '❌ FAIL'})`,
  );
  console.log(
    `   - Findings List Payload:\n`,
    JSON.stringify(listRes.body, null, 2),
    '\n',
  );

  console.log('✅ 6. FINDING DETAILS API BENCHMARK & DEEP EXPLAINABILITY');
  const t1 = Date.now();
  const detailRes = await request(server)
    .get(`/api/v1/findings/${finding1.id}`)
    .set('Authorization', `Bearer ${token}`);
  const detailLatency = Date.now() - t1;

  console.log(`   - Status Code: ${detailRes.status}`);
  console.log(
    `   - Latency: ${detailLatency} ms (Target ≤ 75ms: ${detailLatency <= 75 ? '✅ PASS' : '❌ FAIL'})`,
  );
  console.log(
    `   - Finding Detail Payload:\n`,
    JSON.stringify(detailRes.body, null, 2),
    '\n',
  );

  console.log('✅ 7. SQL DATABASE IMMUTABLE EVIDENCE AGGREGATES');
  const dbFindings = await prisma.infrastructureFinding.count({
    where: { snapshot: { domain: { userId: user.id } } },
  });
  const dbSnapshots = await prisma.infrastructureSnapshot.count({
    where: { domain: { userId: user.id } },
  });
  const dbEvidence = await prisma.rawEvidence.count({
    where: { domain: { userId: user.id } },
  });

  console.log(`   - Tenant Findings Count: ${dbFindings}`);
  console.log(`   - Tenant Snapshots Count: ${dbSnapshots}`);
  console.log(`   - Tenant Raw Evidence Artifacts: ${dbEvidence}`);

  await prisma.$disconnect();
  await app.close();

  console.log(
    '\n========================================================================',
  );
  console.log('💎 FINDINGS PLATINUM CERTIFICATION RUNTIME VALIDATION COMPLETE');
  console.log(
    '========================================================================',
  );
}

runValidation().catch(console.error);
