import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuestUnderstandingService } from './guest-understanding.service';
import {
  CreateGuestUnderstandingDto,
  GuestUnderstandingResponseDto,
  GuestJobStatusResponseDto,
  GuestUnderstandingResultDto,
  ClaimGuestSessionDto,
  ClaimGuestSessionResponseDto,
} from './dto/guest-understanding.dto';

@ApiTags('Guest Experience')
@Controller('guest')
export class GuestUnderstandingController {
  constructor(private readonly guestService: GuestUnderstandingService) {}

  @Post('understand')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start guest infrastructure understanding',
    description:
      'Accepts a target domain, provisions a backend GuestSession, queues an understanding job, and returns 202 Accepted with job and session identifiers.',
  })
  @ApiResponse({
    status: 202,
    description: 'Guest understanding request accepted and queued.',
    type: GuestUnderstandingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid domain input or payload.',
  })
  @ApiResponse({
    status: 429,
    description: 'Guest rate limit exceeded.',
  })
  async understand(
    @Body() dto: CreateGuestUnderstandingDto,
  ): Promise<GuestUnderstandingResponseDto> {
    return this.guestService.startGuestUnderstanding(dto);
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get guest understanding job status',
    description: 'Retrieves current status for a guest understanding job.',
  })
  @ApiParam({ name: 'jobId', description: 'Guest understanding job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved.',
    type: GuestJobStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found.',
  })
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<GuestJobStatusResponseDto> {
    return this.guestService.getGuestJobStatus(jobId);
  }

  @Get('result/:jobId')
  @ApiOperation({
    summary: 'Get completed guest understanding result',
    description:
      'Retrieves structured infrastructure understanding findings for a completed job.',
  })
  @ApiParam({ name: 'jobId', description: 'Guest understanding job ID' })
  @ApiResponse({
    status: 200,
    description: 'Understanding result retrieved.',
    type: GuestUnderstandingResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found.',
  })
  async getResult(
    @Param('jobId') jobId: string,
  ): Promise<GuestUnderstandingResultDto> {
    return this.guestService.getGuestUnderstandingResult(jobId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim guest understanding session',
    description:
      'Transfers guest-discovered domain and understanding history to the authenticated user account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Guest session claimed successfully.',
    type: ClaimGuestSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing or expired session token.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Session already claimed by another user.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Guest session not found.',
  })
  async claimSession(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: ClaimGuestSessionDto,
  ): Promise<ClaimGuestSessionResponseDto> {
    return this.guestService.claimGuestSession(req.user.id, dto.sessionToken);
  }
}

@ApiTags('Guest Experience')
@Controller('jobs')
export class JobsController {
  constructor(private readonly guestService: GuestUnderstandingService) {}

  @Get(':jobId')
  @ApiOperation({
    summary: 'Get job status by ID',
    description: 'Retrieves status for a guest or platform understanding job.',
  })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved.',
    type: GuestJobStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found.',
  })
  async getJob(
    @Param('jobId') jobId: string,
  ): Promise<GuestJobStatusResponseDto> {
    return this.guestService.getGuestJobStatus(jobId);
  }

  @Get(':jobId/result')
  @ApiOperation({
    summary: 'Get job understanding result by ID',
    description:
      'Retrieves structured infrastructure result for a completed understanding job.',
  })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job result retrieved.',
    type: GuestUnderstandingResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found.',
  })
  async getJobResult(
    @Param('jobId') jobId: string,
  ): Promise<GuestUnderstandingResultDto> {
    return this.guestService.getGuestUnderstandingResult(jobId);
  }
}
