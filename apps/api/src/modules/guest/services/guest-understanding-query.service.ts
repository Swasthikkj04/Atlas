import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestSessionService } from './guest-session.service';
import { GuestUnderstandingPresenter } from '../presenters/guest-understanding.presenter';
import { GuestUnderstandingStatusDto } from '../dto/response/guest-understanding-status.dto';

@Injectable()
export class GuestUnderstandingQueryService {
  constructor(
    private readonly sessionService: GuestSessionService,
    private readonly prisma: PrismaService,
  ) {}

  async getGuestUnderstandingStatus(
    jobId: string,
    sessionToken?: string,
  ): Promise<GuestUnderstandingStatusDto> {
    if (!sessionToken) {
      throw new UnauthorizedException('Guest session token is required.');
    }

    // 1. Validate Guest Session
    const session = await this.sessionService.resumeSession(sessionToken);

    // 2. Validate Session Ownership of Job
    if (session.understandingJobId && session.understandingJobId !== jobId) {
      throw new ForbiddenException(
        'Guest session does not have access to the requested job.',
      );
    }

    // 3. Query UnderstandingJob metadata
    const job = await this.prisma.understandingJob.findUnique({
      where: { id: jobId },
      include: {
        infrastructureSnapshot: {
          include: {
            brief: true,
            findings: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Understanding job not found.');
    }

    // 4. Map presentation states
    if (job.status === JobStatus.FAILED) {
      return GuestUnderstandingPresenter.toFailedResponse(job.errorMessage);
    }

    if (job.status === JobStatus.COMPLETED) {
      const snapshot = job.infrastructureSnapshot;
      const brief = snapshot?.brief || null;
      const findingsCount = snapshot?.findings?.length || 0;

      return GuestUnderstandingPresenter.toCompletedResponse(brief, findingsCount);
    }

    // PENDING or RUNNING status
    return GuestUnderstandingPresenter.toProgressResponse({
      status: job.status,
      current_phase: (job as any).current_phase || (job as any).phase || null,
    });
  }
}
