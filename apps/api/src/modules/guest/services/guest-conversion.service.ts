import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GuestSessionStatus, JobStatus } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestSessionService } from './guest-session.service';
import { GuestSessionRepository } from '../repositories/guest-session.repository';
import { GuestDomainMaterializer } from '../materializers/guest-domain.materializer';
import { GuestAnalyticsService } from './guest-analytics.service';
import { GuestConvertRequestDto } from '../dto/request/guest-convert-request.dto';
import { GuestConvertResponseDto } from '../dto/response/guest-convert-response.dto';

@Injectable()
export class GuestConversionService {
  constructor(
    private readonly sessionService: GuestSessionService,
    private readonly sessionRepository: GuestSessionRepository,
    private readonly authService: AuthService,
    private readonly domainMaterializer: GuestDomainMaterializer,
    private readonly prisma: PrismaService,
    private readonly analyticsService: GuestAnalyticsService,
  ) {}

  async convertGuestSession(
    dto: GuestConvertRequestDto,
    sessionToken?: string,
  ): Promise<GuestConvertResponseDto> {
    if (!sessionToken) {
      throw new UnauthorizedException('Guest session token is required.');
    }

    // 1. Resume & Validate Guest Session
    const session = await this.sessionService.resumeSession(sessionToken);

    if (session.status === GuestSessionStatus.CONVERTED) {
      throw new BadRequestException('Guest session has already been converted.');
    }

    if (!session.understandingJobId) {
      throw new BadRequestException('No understanding job associated with guest session.');
    }

    // Non-blocking analytics tracking
    void this.analyticsService.trackConversionStarted(session.id).catch(() => null);

    // 2. Validate Understanding Job is COMPLETED
    const job = await this.prisma.understandingJob.findUnique({
      where: { id: session.understandingJobId },
      include: { domain: true },
    });

    if (!job) {
      throw new NotFoundException('Associated understanding job not found.');
    }

    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException(
        'Understanding job is still in progress. Conversion requires completed understanding.',
      );
    }

    // 3. Register Account via AuthService
    await this.authService.register({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
    });

    // 4. Issue JWT Tokens via AuthService
    const authResult = await this.authService.login(
      {
        email: dto.email,
        password: dto.password,
      },
      {
        browser: 'Guest Client',
        operatingSystem: 'Web',
        deviceType: 'Desktop',
        deviceName: 'Guest Account Conversion',
        ipAddress: '127.0.0.1',
      },
    );

    // 5. Materialize Customer-Owned Domain
    const targetDomainName = job.domain.domainName;
    await this.domainMaterializer.materializeUserDomain(
      authResult.user.id,
      targetDomainName,
      job.id,
    );

    // 6. Transition GuestSession status to CONVERTED
    await this.sessionRepository.markConverted(session.id);

    // Calculate duration in seconds
    const durationSeconds = Math.max(
      1,
      Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000),
    );

    void this.analyticsService
      .trackConverted(session.id, targetDomainName, durationSeconds)
      .catch(() => null);

    // 7. Return Product Response
    return {
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        fullName: authResult.user.fullName,
      },
      workspace: {
        id: `wsp-${authResult.user.id}`,
        name: `${authResult.user.fullName}'s Workspace`,
      },
      authentication: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
      },
      next: {
        action: 'OPEN_WORKSPACE',
      },
    };
  }
}
