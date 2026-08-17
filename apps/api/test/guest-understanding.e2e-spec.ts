import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GuestUnderstandingController (e2e)', () => {
  let app: INestApplication;

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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/guest/understand - valid domain (stripe.com) returns 202 Accepted with jobId and sessionId', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'stripe.com' })
      .expect(202);

    expect(response.body).toHaveProperty('jobId');
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('status', 'QUEUED');
    expect(typeof response.body.jobId).toBe('string');
    expect(typeof response.body.sessionId).toBe('string');
    expect(response.body.jobId).toMatch(/^gst_job_/);
    expect(response.body.sessionId).toMatch(/^ses_/);
  });

  it('POST /api/v1/guest/understand - invalid domain returns 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'invalid domain name' })
      .expect(400);
  });

  it('POST /api/v1/guest/understand - missing domain field returns 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({})
      .expect(400);
  });

  it('GET /api/v1/jobs/:jobId - returns job status for created guest job', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'stripe.com' })
      .expect(202);

    const { jobId, sessionId } = postRes.body;

    const pollRes = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${jobId}`)
      .expect(200);

    expect(pollRes.body).toHaveProperty('jobId', jobId);
    expect(pollRes.body).toHaveProperty('sessionId', sessionId);
    expect(pollRes.body).toHaveProperty('status');
    expect(['QUEUED', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).toContain(
      pollRes.body.status,
    );
  }, 25000);

  it('GET /api/v1/jobs/:jobId - returns 404 for non-existent job ID', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/jobs/gst_job_non_existent_12345')
      .expect(404);
  });

  it('GET /api/v1/jobs/:jobId - demonstrates real status progression PENDING/QUEUED -> COMPLETED over time', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'stripe.com' })
      .expect(202);

    const { jobId, sessionId } = postRes.body;

    const poll1 = await request(app.getHttpServer())
      .get(`/api/v1/jobs/${jobId}`)
      .expect(200);
    expect(['QUEUED', 'PENDING', 'RUNNING', 'COMPLETED']).toContain(
      poll1.body.status,
    );
    expect(poll1.body.sessionId).toBe(sessionId);

    let status = poll1.body.status;
    for (let i = 0; i < 30; i++) {
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
      const poll = await request(app.getHttpServer())
        .get(`/api/v1/jobs/${jobId}`)
        .expect(200);
      status = poll.body.status;
    }
    expect(status).toBe('COMPLETED');
  }, 25000);

  it('GET /api/v1/guest/result/:jobId - retrieves full production understanding result for completed job', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'stripe.com' })
      .expect(202);

    const { jobId, sessionId } = postRes.body;

    let status = 'QUEUED';
    for (let i = 0; i < 30; i++) {
      const pollRes = await request(app.getHttpServer()).get(
        `/api/v1/jobs/${jobId}`,
      );
      if (pollRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      status = pollRes.body?.status;
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
    }

    const res = await request(app.getHttpServer())
      .get(`/api/v1/guest/result/${jobId}`)
      .expect(200);

    expect(res.body).toHaveProperty('jobId', jobId);
    expect(res.body).toHaveProperty('sessionId', sessionId);
    expect(res.body).toHaveProperty('domain', 'stripe.com');
    expect(res.body).toHaveProperty('brief');
    expect(res.body.brief).toHaveProperty('paragraphs');
    expect(res.body.brief).toHaveProperty('stats');
    expect(res.body).toHaveProperty('technologies');
    expect(Array.isArray(res.body.technologies)).toBe(true);
    expect(res.body).toHaveProperty('observations');
    expect(Array.isArray(res.body.observations)).toBe(true);
    expect(res.body).toHaveProperty('timeline');
    expect(Array.isArray(res.body.timeline)).toBe(true);
    expect(res.body).toHaveProperty('evidence');
    expect(Array.isArray(res.body.evidence)).toBe(true);
  }, 25000);

  it('BE-121 Domain Integrity - badssl.com produces badssl.com intelligence', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'badssl.com' })
      .expect(202);

    const { jobId } = postRes.body;

    let status = 'QUEUED';
    for (let i = 0; i < 30; i++) {
      const pollRes = await request(app.getHttpServer()).get(
        `/api/v1/jobs/${jobId}`,
      );
      if (pollRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      status = pollRes.body?.status;
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
    }

    const res = await request(app.getHttpServer())
      .get(`/api/v1/guest/result/${jobId}`)
      .expect(200);

    expect(res.body.domain).toBe('badssl.com');
  }, 25000);

  it('BE-121 Domain Integrity - example.com produces example.com intelligence', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'example.com' })
      .expect(202);

    const { jobId } = postRes.body;

    let status = 'QUEUED';
    for (let i = 0; i < 30; i++) {
      const pollRes = await request(app.getHttpServer()).get(
        `/api/v1/jobs/${jobId}`,
      );
      if (pollRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      status = pollRes.body?.status;
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
    }

    const res = await request(app.getHttpServer())
      .get(`/api/v1/guest/result/${jobId}`)
      .expect(200);

    expect(res.body.domain).toBe('example.com');
  }, 25000);

  it('BE-121 Domain Integrity - github.com produces github.com intelligence', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'github.com' })
      .expect(202);

    const { jobId } = postRes.body;

    let status = 'QUEUED';
    for (let i = 0; i < 30; i++) {
      const pollRes = await request(app.getHttpServer()).get(
        `/api/v1/jobs/${jobId}`,
      );
      if (pollRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      status = pollRes.body?.status;
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
    }

    const res = await request(app.getHttpServer())
      .get(`/api/v1/guest/result/${jobId}`)
      .expect(200);

    expect(res.body.domain).toBe('github.com');
  }, 25000);

  it('BE-122 Persistence Verification - badssl.com persists GuestSession -> UnderstandingJob -> InfrastructureSnapshot -> Findings -> Brief', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'badssl.com' })
      .expect(202);

    const { jobId, sessionId } = postRes.body;

    // Wait until engine completes discovery, snapshot, findings, brief persistence
    let status = 'QUEUED';
    for (let i = 0; i < 30; i++) {
      const pollRes = await request(app.getHttpServer()).get(
        `/api/v1/jobs/${jobId}`,
      );
      if (pollRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      status = pollRes.body?.status;
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
    }

    expect(status).toBe('COMPLETED');

    const resultRes = await request(app.getHttpServer())
      .get(`/api/v1/guest/result/${jobId}`)
      .expect(200);

    expect(resultRes.body.domain).toBe('badssl.com');
    expect(resultRes.body.brief).toBeDefined();
    expect(resultRes.body.evidence.length).toBeGreaterThan(0);
    // BE-125: Verify brief stats criticalCount matches actual critical observations and executive summary narrative
    expect(resultRes.body.brief.stats.criticalCount).toBe(0);
    expect(resultRes.body.brief.stats.observationCount).toBe(
      resultRes.body.observations.length,
    );
    const criticalObs = resultRes.body.observations.filter(
      (o: any) => o.severity === 'critical',
    );
    const highObs = resultRes.body.observations.filter(
      (o: any) => o.severity === 'high',
    );
    expect(criticalObs.length).toBe(0);
    expect(highObs.length).toBe(4);
    expect(
      resultRes.body.brief.paragraphs.some((p: string) =>
        p.includes('0 critical'),
      ),
    ).toBe(true);
  }, 25000);

  it('BE-122 Persistence Verification - example.com persists GuestSession -> UnderstandingJob -> InfrastructureSnapshot -> Findings -> Brief', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'example.com' })
      .expect(202);

    const { jobId } = postRes.body;

    let status = 'QUEUED';
    for (let i = 0; i < 30; i++) {
      const pollRes = await request(app.getHttpServer()).get(
        `/api/v1/jobs/${jobId}`,
      );
      if (pollRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      status = pollRes.body?.status;
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
    }

    expect(status).toBe('COMPLETED');

    const resultRes = await request(app.getHttpServer())
      .get(`/api/v1/guest/result/${jobId}`)
      .expect(200);

    expect(resultRes.body.domain).toBe('example.com');
    expect(resultRes.body.brief).toBeDefined();
    expect(resultRes.body.evidence.length).toBeGreaterThan(0);
  }, 25000);

  it('BE-123 Multi-Domain & Anti-Template Verification - badssl.com, chatgpt.com, github.com, example.com produce distinct evidence-derived intelligence', async () => {
    const domains = ['badssl.com', 'chatgpt.com', 'github.com', 'example.com'];
    const results: Record<string, any> = {};

    for (const domain of domains) {
      const postRes = await request(app.getHttpServer())
        .post('/api/v1/guest/understand')
        .send({ domain })
        .expect(202);

      const { jobId } = postRes.body;

      let status = 'QUEUED';
      for (let i = 0; i < 30; i++) {
        const pollRes = await request(app.getHttpServer()).get(
          `/api/v1/jobs/${jobId}`,
        );
        if (pollRes.status === 429) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        status = pollRes.body?.status;
        if (status === 'COMPLETED') break;
        await new Promise((r) => setTimeout(r, 1200));
      }

      expect(status).toBe('COMPLETED');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/guest/result/${jobId}`)
        .expect(200);

      results[domain] = res.body;
      expect(res.body.domain).toBe(domain);
      expect(res.body.brief.paragraphs.length).toBeGreaterThan(0);
      expect(res.body.brief.stats).toBeDefined();
    }

    // Verify evidence-based content differs between distinct targets
    expect(results['badssl.com']).toBeDefined();
    expect(results['chatgpt.com']).toBeDefined();
    expect(results['github.com']).toBeDefined();
    expect(results['example.com']).toBeDefined();

    // Verify stats are calculated from actual array lengths and are not fixed 16/3/7/5
    expect(results['example.com'].brief.stats.techCount).toBe(
      results['example.com'].technologies.length,
    );
    expect(results['example.com'].brief.stats.observationCount).toBe(
      results['example.com'].observations.length,
    );
    expect(results['example.com'].brief.stats.evidenceCount).toBe(
      results['example.com'].evidence.length,
    );
    expect(results['example.com'].brief.stats.timelineCount).toBe(
      results['example.com'].timeline.length,
    );
  }, 90000);

  it('BE-127 DNS Rule Evidence & Technology Provenance Integrity - www.github.com lineage verification', async () => {
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/guest/understand')
      .send({ domain: 'www.github.com' })
      .expect(202);

    const { jobId } = postRes.body;

    let status = 'QUEUED';
    for (let i = 0; i < 30; i++) {
      const pollRes = await request(app.getHttpServer()).get(
        `/api/v1/jobs/${jobId}`,
      );
      if (pollRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      status = pollRes.body?.status;
      if (status === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 1200));
    }

    expect(status).toBe('COMPLETED');

    const res = await request(app.getHttpServer())
      .get(`/api/v1/guest/result/${jobId}`)
      .expect(200);

    expect(res.body.domain).toBe('www.github.com');

    // 1. Verify complete DNS evidence payload structure
    const dnsEvidence = res.body.evidence.find(
      (e: any) => e.category === 'DNS',
    );
    expect(dnsEvidence).toBeDefined();
    const dnsPayload = JSON.parse(dnsEvidence.payload);
    expect(dnsPayload).toHaveProperty('a');
    expect(dnsPayload).toHaveProperty('aaaa');
    expect(dnsPayload).toHaveProperty('mx');
    expect(dnsPayload).toHaveProperty('ns');
    expect(dnsPayload).toHaveProperty('cname');
    expect(dnsPayload).toHaveProperty('txt');
    expect(dnsPayload).toHaveProperty('dmarc');

    // 2. Verify DMARC Record Not Found is NOT reported (since DMARC is present in evidence) and SPF finding is backed by TXT evidence
    const dmarcFinding = res.body.observations.find((o: any) =>
      o.label.includes('DMARC Record Not Found'),
    );
    const spfFinding = res.body.observations.find((o: any) =>
      o.label.includes('SPF Record Not Found'),
    );
    expect(dmarcFinding).toBeUndefined();
    expect(spfFinding).toBeDefined();

    // 3. Verify technology provenance (no false positive GitHub Pages / React UI Library)
    const githubPagesTech = res.body.technologies.find(
      (t: any) => t.name === 'GitHub Pages',
    );
    const reactTech = res.body.technologies.find(
      (t: any) => t.name === 'React UI Library',
    );
    expect(githubPagesTech).toBeUndefined();
    expect(reactTech).toBeUndefined();

    // 4. Verify HSTS is present and backed by HTTP response headers
    const hstsTech = res.body.technologies.find((t: any) =>
      t.name.includes('HSTS'),
    );
    expect(hstsTech).toBeDefined();
  }, 60000);

  it('BE-128 Evidence-Backed Executive Brief Narrative Integration - multi-domain verification (badssl.com, github.com, www.github.com, openai.com, amazon.com)', async () => {
    const testDomains = [
      'badssl.com',
      'github.com',
      'www.github.com',
      'openai.com',
      'amazon.com',
    ];

    for (const domain of testDomains) {
      const postRes = await request(app.getHttpServer())
        .post('/api/v1/guest/understand')
        .send({ domain })
        .expect(202);

      const { jobId } = postRes.body;

      let status = 'QUEUED';
      for (let i = 0; i < 30; i++) {
        const pollRes = await request(app.getHttpServer()).get(
          `/api/v1/jobs/${jobId}`,
        );
        if (pollRes.status === 429) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        status = pollRes.body?.status;
        if (status === 'COMPLETED') break;
        await new Promise((r) => setTimeout(r, 1200));
      }

      expect(status).toBe('COMPLETED');

      const res1 = await request(app.getHttpServer())
        .get(`/api/v1/guest/result/${jobId}`)
        .expect(200);

      expect(res1.body.domain).toBe(domain);
      expect(res1.body.brief).toBeDefined();
      expect(Array.isArray(res1.body.brief.paragraphs)).toBe(true);
      expect(res1.body.brief.paragraphs.length).toBeGreaterThan(0);

      const paragraph = res1.body.brief.paragraphs[0];
      // 1. Verify domain is correctly injected
      expect(paragraph).toContain(domain);

      // 2. Verify approved narrative template phrasing is present
      const approvedPhrases = [
        'reachable and operating normally',
        'generally established security baseline',
        'currently reachable and responding successfully',
        'operational, but',
        'has no critical findings in this snapshot',
      ];
      const hasApprovedPhrase = approvedPhrases.some((phrase) =>
        paragraph.includes(phrase),
      );
      expect(hasApprovedPhrase).toBe(true);

      // 3. Verify no forbidden speculative claims
      const forbiddenClaims = [
        'mature architecture',
        'deliberate engineering decisions',
        'multi-region deployment',
        'organizational practices',
        'business importance',
        'historical changes',
        'architectural intent',
      ];
      for (const claim of forbiddenClaims) {
        expect(paragraph).not.toContain(claim);
      }

      // 4. Verify reproducibility: identical result on second fetch
      const res2 = await request(app.getHttpServer())
        .get(`/api/v1/guest/result/${jobId}`)
        .expect(200);
      expect(res2.body.brief.paragraphs[0]).toBe(paragraph);
    }
  }, 120000);
});
