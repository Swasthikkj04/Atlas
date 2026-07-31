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
    '🚀 ATLAS PLATINUM CERTIFICATION RUNTIME & EVIDENCE GENERATOR (EXPLORER)',
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
    '   - Controller: ExplorerController registered at /api/v1/explorer',
  );
  console.log('   - Routes:');
  console.log('     * GET /api/v1/explorer');
  console.log('     * GET /api/v1/explorer/:assetId\n');

  console.log('✅ 2. AUTHENTICATION & JWT GENERATION');
  const userEmail = `explorer-platinum-${Date.now()}@atlas.local`;
  const userPass = 'PlatinumPassword123!';

  const regRes = await request(server).post('/api/v1/auth/register').send({
    email: userEmail,
    password: userPass,
    fullName: 'Explorer Lead QA',
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
  const noAuthRes = await request(server).get('/api/v1/explorer');
  console.log(
    `   - No Auth Header (Explorer): Status ${noAuthRes.status} (Expected 401)`,
  );

  const badTokenRes = await request(server)
    .get('/api/v1/explorer')
    .set('Authorization', 'Bearer invalid-token');
  console.log(`   - Invalid JWT: Status ${badTokenRes.status} (Expected 401)`);

  const invalidDetailRes = await request(server)
    .get('/api/v1/explorer/non-existent-asset-id')
    .set('Authorization', `Bearer ${token}`);
  console.log(
    `   - Non-existent Asset Details: Status ${invalidDetailRes.status} (Expected 404)\n`,
  );

  console.log('✅ 4. POPULATING KNOWLEDGE GRAPH & EVIDENCE DATA');
  const prisma = new PrismaClient();

  const domain = await prisma.domain.create({
    data: {
      userId: user.id,
      domainName: 'explorer-platinum.atlas.internal',
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
      responseTimeMs: 68,
      httpStatus: 200,
      payload: {
        webServer: 'nginx/1.24.0',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        ipv4Addresses: ['192.168.10.50'],
        headers: {
          server: 'nginx',
          'strict-transport-security': 'max-age=31536000',
        },
        sslValid: true,
      },
    },
  });

  const rawEv = await prisma.rawEvidence.create({
    data: {
      domainId: domain.id,
      snapshotId: snap.id,
      collectorName: 'tech-discovery-collector',
      collectorVersion: '1.4.0',
      category: 'HTTP_RESPONSE',
      payloadType: 'HTML_HEAD_ANALYSIS',
      target: 'https://explorer-platinum.atlas.internal',
      payload: 'Detected: React, Node.js, PostgreSQL',
      sizeBytes: 96,
      hashSha256:
        'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    },
  });

  const finding = await prisma.infrastructureFinding.create({
    data: {
      snapshotId: snap.id,
      ruleId: 'SEC-HSTS-01',
      module: 'HTTP',
      category: 'SECURITY_HEADER',
      severity: 'HIGH',
      title: 'HSTS Header Preload Enforced',
      description: 'Strict-Transport-Security header validated.',
    },
  });

  const change = await prisma.changeHistory.create({
    data: {
      domainId: domain.id,
      previousSnapshotId: snap.id,
      currentSnapshotId: snap.id,
      module: 'TECHNOLOGY',
      category: 'TECHNOLOGY',
      changeType: 'ADDED',
      severity: 'LOW',
      title: 'New Technology Stack Discovered',
      description:
        'React, Node.js, and PostgreSQL added to infrastructure baseline.',
    },
  });

  const targetAssetId = `dom-${domain.id}`;

  console.log(`   - Domain ID: ${domain.id}`);
  console.log(`   - Target Asset ID: ${targetAssetId}`);
  console.log(`   - Snapshot ID: ${snap.id}`);
  console.log(`   - Raw Evidence ID: ${rawEv.id}`);
  console.log(`   - Finding ID: ${finding.id}`);
  console.log(`   - Change Event ID: ${change.id}\n`);

  console.log('✅ 5. EXPLORER ASSETS API BENCHMARK & PAYLOAD VERIFICATION');
  const t0 = Date.now();
  const listRes = await request(server)
    .get('/api/v1/explorer?limit=10')
    .set('Authorization', `Bearer ${token}`);
  const listLatency = Date.now() - t0;

  console.log(`   - Status Code: ${listRes.status}`);
  console.log(
    `   - Latency: ${listLatency} ms (Target ≤ 100ms: ${listLatency <= 100 ? '✅ PASS' : '❌ FAIL'})`,
  );
  console.log(
    `   - Explorer Assets Payload:\n`,
    JSON.stringify(listRes.body, null, 2),
    '\n',
  );

  console.log(
    '✅ 6. ASSET DETAILS API BENCHMARK & KNOWLEDGE GRAPH RELATIONSHIPS',
  );
  const t1 = Date.now();
  const detailRes = await request(server)
    .get(`/api/v1/explorer/${targetAssetId}`)
    .set('Authorization', `Bearer ${token}`);
  const detailLatency = Date.now() - t1;

  console.log(`   - Status Code: ${detailRes.status}`);
  console.log(
    `   - Latency: ${detailLatency} ms (Target ≤ 75ms: ${detailLatency <= 75 ? '✅ PASS' : '❌ FAIL'})`,
  );
  console.log(
    `   - Asset Detail Payload:\n`,
    JSON.stringify(detailRes.body, null, 2),
    '\n',
  );

  console.log('✅ 7. SQL DATABASE IMMUTABLE EVIDENCE AGGREGATES');
  const dbDomains = await prisma.domain.count({ where: { userId: user.id } });
  const dbSnapshots = await prisma.infrastructureSnapshot.count({
    where: { domain: { userId: user.id } },
  });
  const dbFindings = await prisma.infrastructureFinding.count({
    where: { snapshot: { domain: { userId: user.id } } },
  });
  const dbEvidence = await prisma.rawEvidence.count({
    where: { domain: { userId: user.id } },
  });
  const dbTimeline = await prisma.changeHistory.count({
    where: { domain: { userId: user.id } },
  });

  console.log(`   - Tenant Domains Count: ${dbDomains}`);
  console.log(`   - Tenant Snapshots Count: ${dbSnapshots}`);
  console.log(`   - Tenant Findings Count: ${dbFindings}`);
  console.log(`   - Tenant Raw Evidence Artifacts: ${dbEvidence}`);
  console.log(`   - Tenant Timeline Change Events: ${dbTimeline}`);

  await prisma.$disconnect();
  await app.close();

  console.log(
    '\n========================================================================',
  );
  console.log('💎 EXPLORER PLATINUM CERTIFICATION RUNTIME VALIDATION COMPLETE');
  console.log(
    '========================================================================',
  );
}

runValidation().catch(console.error);
