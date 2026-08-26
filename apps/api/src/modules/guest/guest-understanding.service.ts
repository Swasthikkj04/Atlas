import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GuestSessionStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UnderstandingEngine } from '../understanding/understanding.engine';
import { InfrastructureSnapshotService } from '../infrastructure-snapshots/services/infrastructure-snapshot.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { InfrastructureBriefService } from '../infrastructure-brief/services/infrastructure-brief.service';
import {
  CreateGuestUnderstandingDto,
  GuestUnderstandingResponseDto,
  GuestJobStatusResponseDto,
  GuestUnderstandingResultDto,
  ClaimGuestSessionResponseDto,
} from './dto/guest-understanding.dto';

@Injectable()
export class GuestUnderstandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly understandingEngine: UnderstandingEngine,
    private readonly snapshotService: InfrastructureSnapshotService,
    private readonly findingService: InfrastructureFindingService,
    private readonly briefService: InfrastructureBriefService,
  ) {}

  async startGuestUnderstanding(
    dto: CreateGuestUnderstandingDto,
  ): Promise<GuestUnderstandingResponseDto> {
    const rawDomain = dto.domain.trim().toLowerCase();
    let domainName = rawDomain.replace(/^https?:\/\//i, '');
    const slashIdx = domainName.indexOf('/');
    if (slashIdx !== -1) domainName = domainName.slice(0, slashIdx);

    if (!domainName) {
      throw new BadRequestException('Invalid domain name provided.');
    }

    // 1. Ensure system guest user exists in database
    let guestUser = await this.prisma.user.findFirst({
      where: { email: 'guest@system.atlas' },
    });

    if (!guestUser) {
      guestUser = await this.prisma.user.create({
        data: {
          email: 'guest@system.atlas',
          fullName: 'System Guest User',
          status: 'ACTIVE',
        },
      });
    }

    // 2. Ensure domain record exists in database
    let domainRecord = await this.prisma.domain.findFirst({
      where: { userId: guestUser.id, domainName },
    });

    if (!domainRecord) {
      domainRecord = await this.prisma.domain.create({
        data: {
          userId: guestUser.id,
          domainName,
        },
      });
    }

    // 3. Create real UnderstandingJob in database with RUNNING status so worker does not double-process
    const jobId = `gst_job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const now = new Date();
    const job = await this.prisma.understandingJob.create({
      data: {
        id: jobId,
        domainId: domainRecord.id,
        trigger: 'MANUAL',
        status: 'RUNNING',
        workerId: 'guest_direct_worker',
        startedAt: now,
        heartbeatAt: now,
        leaseUntil: new Date(now.getTime() + 60000),
        attemptCount: 1,
        maxAttempts: 3,
      },
    });

    // 4. Create GuestSession linked to UnderstandingJob
    const sessionToken = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await this.prisma.guestSession.create({
      data: {
        sessionToken,
        domain: domainName,
        understandingJobId: job.id,
        status: 'ACTIVE',
        expiresAt,
      },
    });

    // 5. Execute production UnderstandingEngine pipeline asynchronously in background
    this.understandingEngine
      .execute(job.id, domainRecord.id, domainName)
      .then(async () => {
        await this.prisma.understandingJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            leaseUntil: null,
            nextRetryAt: null,
          },
        });
      })
      .catch(async (err) => {
        await this.prisma.understandingJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: (err as Error)?.message || 'Engine execution failed',
            completedAt: new Date(),
            leaseUntil: null,
            nextRetryAt: null,
          },
        });
      });

    return {
      jobId: job.id,
      sessionId: session.sessionToken,
      status: 'QUEUED',
    };
  }

  async getGuestJobStatus(jobId: string): Promise<GuestJobStatusResponseDto> {
    const session = await this.prisma.guestSession.findFirst({
      where: { understandingJobId: jobId },
    });

    if (!session) {
      throw new NotFoundException(`Job with ID '${jobId}' not found.`);
    }

    const job = await this.prisma.understandingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID '${jobId}' not found.`);
    }

    return {
      jobId: job.id,
      sessionId: session.sessionToken,
      status: job.status,
      error: job.errorMessage,
    };
  }

  async getGuestUnderstandingResult(
    jobId: string,
  ): Promise<GuestUnderstandingResultDto> {
    const session = await this.prisma.guestSession.findFirst({
      where: { understandingJobId: jobId },
    });

    if (!session) {
      throw new NotFoundException(`Job with ID '${jobId}' not found.`);
    }

    const job = await this.prisma.understandingJob.findUnique({
      where: { id: jobId },
      include: {
        domain: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID '${jobId}' not found.`);
    }

    const domainName =
      job.domain?.domainName || session.domain || 'example.com';

    // Query real persisted InfrastructureSnapshot from database
    const snapshotRecord = await this.prisma.infrastructureSnapshot.findUnique({
      where: { jobId },
    });

    if (!snapshotRecord) {
      throw new NotFoundException(
        `Infrastructure snapshot for job '${jobId}' not found.`,
      );
    }

    // Query real persisted InfrastructureFinding[] from database
    const findingRecords = await this.prisma.infrastructureFinding.findMany({
      where: { snapshotId: snapshotRecord.id },
    });

    // Query real persisted InfrastructureBrief from database
    const briefRecord = await this.prisma.infrastructureBrief.findUnique({
      where: { snapshotId: snapshotRecord.id },
    });

    const snapshotPayload = snapshotRecord.payload as any;
    const dnsData = snapshotPayload?.dns || {};
    const httpData = snapshotPayload?.http || {};
    const sslData = snapshotPayload?.ssl || {};
    const techData = snapshotPayload?.technology || [];

    // Parse summary paragraphs from persisted InfrastructureBrief
    let briefRecordToUse = briefRecord;
    const approvedAnchors = [
      'reachable and operating normally',
      'generally established security baseline',
      'currently reachable and responding successfully',
      'operational, but',
      'has no critical findings in this snapshot',
    ];

    const isApprovedBrief =
      briefRecordToUse?.summary &&
      approvedAnchors.some((anchor) =>
        briefRecordToUse!.summary.includes(anchor),
      ) &&
      !briefRecordToUse.summary
        .toLowerCase()
        .includes('infrastructure processed');

    if (briefRecordToUse?.summary && !isApprovedBrief) {
      briefRecordToUse = await this.briefService.generate(snapshotRecord.id);
    }

    const summaryText =
      briefRecordToUse?.summary ||
      `${domainName} infrastructure snapshot captured.`;
    const paragraphs = summaryText
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      paragraphs.push(`${domainName} infrastructure snapshot captured.`);
    }

    // Format technologies from discovery snapshot payload
    const rawTechArray = Array.isArray(techData?.technologies)
      ? techData.technologies
      : Array.isArray(techData)
        ? techData
        : [];

    const technologies = rawTechArray.map((t: any) => ({
      name: t.name || 'Technology',
      role: t.role || `Discovered component on ${domainName}`,
      confidence:
        typeof t.confidence === 'number'
          ? t.confidence >= 0.9
            ? 'high'
            : t.confidence >= 0.7
              ? 'medium'
              : 'low'
          : t.confidence?.toLowerCase() === 'high'
            ? 'high'
            : t.confidence?.toLowerCase() === 'medium'
              ? 'medium'
              : 'low',
      category: t.category || 'Infrastructure',
      version: t.version || undefined,
      evidenceCount: t.evidenceCount || 1,
    }));

    if (technologies.length === 0) {
      if (httpData.reachable) {
        technologies.push({
          name: 'HTTP Endpoint',
          role: `Web gateway serving ${domainName}`,
          confidence: 'high',
          category: 'Web Server',
          evidenceCount: 1,
        });
      }
      if (sslData.valid) {
        technologies.push({
          name: 'TLS Certificate',
          role: `Automated TLS encryption for ${domainName}`,
          confidence: 'high',
          category: 'Security',
          evidenceCount: 1,
        });
      }
    }

    // Format observations directly from persisted InfrastructureFinding entities
    const observations = findingRecords.map((f) => ({
      label: f.title,
      body: f.description,
      whyItMatters: `${f.title} impacts infrastructure posture for ${domainName}. Evaluated by rule ${f.ruleId}.`,
      severity: (f.severity ? f.severity.toLowerCase() : 'medium') as any,
      confidence: 'high' as const,
      evidenceCount: 1,
      category: f.category || 'Security',
      firstObserved: (f.createdAt || new Date()).toISOString().split('T')[0],
    }));

    // Format timeline strictly from persisted findings and snapshot creation timestamp
    const timeline: Array<{
      date: string;
      headline: string;
      narrative: string;
      observationBasis?: string;
      category?: string;
    }> = findingRecords.map((f) => {
      return {
        date: (f.createdAt || snapshotRecord.createdAt)
          .toISOString()
          .split('T')[0],
        headline: f.title,
        narrative: f.description,
        observationBasis: `Persisted finding rule ${f.ruleId} evaluated on snapshot ${snapshotRecord.id}`,
        category: f.category,
      };
    });

    if (timeline.length === 0) {
      timeline.push({
        date: snapshotRecord.createdAt.toISOString().split('T')[0],
        headline: `Infrastructure snapshot captured for ${domainName}`,
        narrative: `Nebula discovery modules completed automated scanning for ${domainName}.`,
        observationBasis: `Persisted snapshot ${snapshotRecord.id}`,
        category: 'Discovery',
      });
    }

    // Format evidence from discovery snapshot payload
    const evidence: Array<{
      id: string;
      category: string;
      title: string;
      summary: string;
      source?: string;
      collectedAt: string;
      payload: string;
      hash?: string;
      collector?: string;
      relatedTechnologies?: string[];
      relatedObservations?: string[];
    }> = [];

    if (httpData.evidenceResult?.rawPayload) {
      evidence.push({
        id: `ev-http-${snapshotRecord.id.slice(0, 8)}`,
        category: 'HTTP Responses',
        title: `HTTP security response headers for ${domainName}`,
        summary: `Captured HTTP response status ${httpData.statusCode} from ${domainName}`,
        source: 'HTTP response',
        collectedAt: snapshotRecord.createdAt.toISOString().split('T')[0],
        payload: JSON.stringify(httpData.evidenceResult.rawPayload, null, 2),
        collector: 'http-discovery v1.0.0',
      });
    }

    if (
      dnsData.a ||
      dnsData.txt ||
      dnsData.aaaa ||
      dnsData.mx ||
      dnsData.dmarc
    ) {
      evidence.push({
        id: `ev-dns-${snapshotRecord.id.slice(0, 8)}`,
        category: 'DNS',
        title: `DNS zone records for ${domainName}`,
        summary: `Captured DNS resource records for ${domainName}`,
        source: 'DNS lookup',
        collectedAt: snapshotRecord.createdAt.toISOString().split('T')[0],
        payload: JSON.stringify(
          {
            a: dnsData.a ?? [],
            aaaa: dnsData.aaaa ?? [],
            mx: dnsData.mx ?? [],
            ns: dnsData.ns ?? [],
            cname: dnsData.cname ?? [],
            txt: dnsData.txt ?? [],
            dmarc: dnsData.dmarc ?? [],
          },
          null,
          2,
        ),
        collector: 'dns-discovery v1.0.0',
      });
    }

    if (sslData.valid !== undefined) {
      evidence.push({
        id: `ev-ssl-${snapshotRecord.id.slice(0, 8)}`,
        category: 'TLS Certificates',
        title: `TLS handshake evaluation for ${domainName}`,
        summary: `Inspected SSL certificate validity and protocol posture for ${domainName}`,
        source: 'TLS handshake',
        collectedAt: snapshotRecord.createdAt.toISOString().split('T')[0],
        payload: JSON.stringify(sslData, null, 2),
        collector: 'ssl-discovery v1.0.0',
      });
    }

    const criticalCount = findingRecords.filter(
      (f) => f.severity === 'CRITICAL',
    ).length;

    return {
      jobId: job.id,
      sessionId: session.sessionToken,
      domain: domainName,
      brief: {
        paragraphs,
        stats: {
          techCount: technologies.length,
          observationCount: observations.length,
          evidenceCount: evidence.length,
          timelineCount: timeline.length,
          criticalCount,
        },
      },
      technologies,
      observations,
      timeline,
      evidence,
    };
  }

  async claimGuestSession(
    userId: string,
    sessionToken: string,
  ): Promise<ClaimGuestSessionResponseDto> {
    const rawSessionToken = sessionToken?.trim();
    if (!rawSessionToken) {
      throw new BadRequestException('Session token is required.');
    }

    const session = await this.prisma.guestSession.findUnique({
      where: { sessionToken: rawSessionToken },
    });

    if (!session) {
      throw new NotFoundException(
        `Guest session '${rawSessionToken}' not found.`,
      );
    }

    if (new Date() > session.expiresAt) {
      throw new BadRequestException('Guest session has expired.');
    }

    if (!session.understandingJobId) {
      throw new BadRequestException(
        'No understanding job found for this guest session.',
      );
    }

    const job = await this.prisma.understandingJob.findUnique({
      where: { id: session.understandingJobId },
      include: {
        domain: true,
        infrastructureSnapshot: true,
      },
    });

    if (!job) {
      throw new NotFoundException(
        `Understanding job for guest session not found.`,
      );
    }

    // Idempotency & Replay Defense Check
    if (session.status === GuestSessionStatus.CONVERTED) {
      if (job.domain?.userId === userId) {
        return {
          success: true,
          message: 'Guest session already claimed.',
          domainId: job.domain.id,
          domainName: job.domain.domainName,
          jobId: job.id,
        };
      }
      throw new ForbiddenException(
        'This guest session has already been claimed by another account.',
      );
    }

    const domainName = session.domain || job.domain.domainName;

    // Resolve or provision Domain for authenticated user
    let userDomain = await this.prisma.domain.findUnique({
      where: {
        userId_domainName: {
          userId,
          domainName,
        },
      },
    });

    if (!userDomain) {
      userDomain = await this.prisma.domain.create({
        data: {
          userId,
          domainName,
          monitoringEnabled: false,
        },
      });
    }

    const snapshot = job.infrastructureSnapshot;

    await this.prisma.$transaction(async (tx) => {
      // 1. Reassign job to user's domain
      await tx.understandingJob.update({
        where: { id: job.id },
        data: { domainId: userDomain.id },
      });

      // 2. Reassign snapshot, findings, brief, verifications, evidences to user's domain
      if (snapshot) {
        await tx.infrastructureSnapshot.update({
          where: { id: snapshot.id },
          data: { domainId: userDomain.id },
        });

        await tx.rawEvidence.updateMany({
          where: { snapshotId: snapshot.id },
          data: { domainId: userDomain.id },
        });

        await tx.infrastructureVerification.updateMany({
          where: { snapshotId: snapshot.id },
          data: { domainId: userDomain.id },
        });

        await tx.changeHistory.updateMany({
          where: {
            OR: [
              { currentSnapshotId: snapshot.id },
              { previousSnapshotId: snapshot.id },
            ],
          },
          data: { domainId: userDomain.id },
        });
      }

      // 3. Mark GuestSession as CONVERTED
      await tx.guestSession.update({
        where: { id: session.id },
        data: { status: GuestSessionStatus.CONVERTED },
      });
    });

    return {
      success: true,
      message: 'Guest understanding successfully claimed.',
      domainId: userDomain.id,
      domainName: userDomain.domainName,
      jobId: job.id,
    };
  }
}
