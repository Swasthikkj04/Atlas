import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  Sse,
  UseGuards,
  UnauthorizedException,
  MessageEvent,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Observable } from 'rxjs';

import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

import { UnderstandingService } from './understanding.service';
import { GuestUnderstandingService } from '../guest/guest-understanding.service';
import { UnderstandingStreamService } from './services/understanding-stream.service';
import { TOTAL_UNDERSTANDING_STAGES } from './contracts/understanding-progress.interface';

@ApiTags('Infrastructure Understanding')
@Controller()
export class UnderstandingController {
  constructor(
    private readonly understandingService: UnderstandingService,
    private readonly guestService: GuestUnderstandingService,
    private readonly streamService: UnderstandingStreamService,
  ) {}

  @Post('domains/:domainId/understand')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger infrastructure understanding analysis',
    description:
      'Initiates an asynchronous discovery job to scan, verify, and understand the target domain infrastructure. Returns 202 Accepted with a Location header pointing to the created job status resource.',
  })
  @ApiParam({
    name: 'domainId',
    description: 'Target domain ID',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 202,
    description: 'Infrastructure understanding job accepted and queued.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 404,
    description: 'Domain not found.',
  })
  async create(
    @Req() request: AuthenticatedRequest,
    @Param('domainId') domainId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const job = await this.understandingService.create(
      request.user.id,
      domainId,
    );
    response.setHeader('Location', `/api/v1/jobs/${job.id}`);
    return job;
  }

  @Get('jobs/:jobId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get understanding job status & result',
    description:
      'Retrieves the status, progress, and output metadata for a specific infrastructure understanding job.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Understanding job ID',
    example: 'job-550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found.',
  })
  async findById(
    @Req() request: AuthenticatedRequest,
    @Param('jobId') jobId: string,
  ) {
    if (jobId.startsWith('gst_job_')) {
      return this.guestService.getGuestJobStatus(jobId);
    }

    if (!request.user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return this.understandingService.findById(request.user.id, jobId);
  }

  @Sse('jobs/:jobId/stream')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Stream understanding job progress via Server-Sent Events (SSE)',
    description:
      'Opens a persistent SSE channel streaming live progress updates, heartbeat telemetry, and stage transitions.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Understanding job ID or Guest Job ID',
    example: 'job-550e8400-e29b-41d4-a716-446655440000',
  })
  async streamJob(
    @Req() request: AuthenticatedRequest,
    @Param('jobId') jobId: string,
  ): Promise<Observable<MessageEvent>> {
    if (jobId.startsWith('gst_job_')) {
      const guestJob = await this.guestService.getGuestJobStatus(jobId);
      const isCompleted = guestJob?.status === 'COMPLETED';
      const initialProgress = isCompleted
        ? {
            currentStage: 'COMPLETED' as any,
            stageIndex: 6,
            totalStages: TOTAL_UNDERSTANDING_STAGES,
            stageLabel: 'Understanding Complete',
            stageDetails:
              'All discovery, fingerprinting, diff, and synthesis stages completed successfully.',
            completedStages: [],
            startedAt: Date.now(),
            lastHeartbeatAt: Date.now(),
          }
        : null;
      return this.streamService.getJobStream(jobId, initialProgress);
    }

    if (!request.user) {
      throw new UnauthorizedException('Authentication required.');
    }

    const job = await this.understandingService.findById(
      request.user.id,
      jobId,
    );
    const progress = (job as any)?.progress ?? null;
    return this.streamService.getJobStream(jobId, progress);
  }

  @Get('domains/:domainId/jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List understanding jobs for domain',
    description:
      'Retrieves all historical understanding jobs executed against a specified domain.',
  })
  @ApiParam({
    name: 'domainId',
    description: 'Target domain ID',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Domain understanding jobs retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  async findByDomain(
    @Req() request: AuthenticatedRequest,
    @Param('domainId') domainId: string,
  ) {
    return this.understandingService.findByDomain(request.user.id, domainId);
  }
}
