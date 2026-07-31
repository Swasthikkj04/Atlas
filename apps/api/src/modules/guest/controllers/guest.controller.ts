import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../../../infrastructure/rate-limiting/rate-limit.decorator';
import { GuestUnderstandRequestDto } from '../dto/request/guest-understand-request.dto';
import { GuestConvertRequestDto } from '../dto/request/guest-convert-request.dto';
import { GuestUnderstandResponseDto } from '../dto/response/guest-understand-response.dto';
import { GuestUnderstandingStatusDto } from '../dto/response/guest-understanding-status.dto';
import { GuestConvertResponseDto } from '../dto/response/guest-convert-response.dto';
import { GuestUnderstandingService } from '../services/guest-understanding.service';
import { GuestUnderstandingQueryService } from '../services/guest-understanding-query.service';
import { GuestConversionService } from '../services/guest-conversion.service';

@ApiTags('Guest')
@Controller('guest')
export class GuestController {
  constructor(
    private readonly guestUnderstandingService: GuestUnderstandingService,
    private readonly guestUnderstandingQueryService: GuestUnderstandingQueryService,
    private readonly guestConversionService: GuestConversionService,
  ) {}

  @RateLimit({ limit: 10, windowSeconds: 900, name: 'guest_understand' })
  @Post('understand')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger guest infrastructure understanding',
    description:
      'Initiates an asynchronous infrastructure discovery job for an unauthenticated guest user. Creates or resumes a GuestSession and enqueues an UnderstandingJob without blocking.',
  })
  @ApiResponse({
    status: 202,
    description: 'Infrastructure understanding request accepted and queued.',
    type: GuestUnderstandResponseDto,
  })
  async understand(
    @Body() dto: GuestUnderstandRequestDto,
    @Headers('x-guest-session-token') sessionToken?: string,
  ): Promise<GuestUnderstandResponseDto> {
    return this.guestUnderstandingService.orchestrateGuestUnderstanding(
      dto.target,
      sessionToken,
    );
  }

  @RateLimit({ limit: 60, windowSeconds: 60, name: 'guest_understanding_query' })
  @Get('understanding/:jobId')
  @ApiOperation({
    summary: 'Get guest understanding progress or result',
    description:
      'Retrieves the presentation progress state or completed executive brief for a guest understanding job.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Understanding Job ID',
    example: 'job-550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Guest understanding presentation state retrieved successfully.',
    type: GuestUnderstandingStatusDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or expired guest session token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Session does not own the requested job.',
  })
  async getStatus(
    @Param('jobId') jobId: string,
    @Headers('x-guest-session-token') sessionToken?: string,
  ): Promise<GuestUnderstandingStatusDto> {
    return this.guestUnderstandingQueryService.getGuestUnderstandingStatus(
      jobId,
      sessionToken,
    );
  }

  @RateLimit({ limit: 5, windowSeconds: 3600, name: 'guest_convert' })
  @Post('convert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Convert guest session to permanent workspace account',
    description:
      'Converts an active, completed guest session into a permanent user account and workspace while materializing customer-owned domain understanding continuity.',
  })
  @ApiResponse({
    status: 201,
    description: 'Guest session converted into registered user workspace successfully.',
    type: GuestConvertResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Session already converted or understanding incomplete.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or expired guest session token.',
  })
  async convert(
    @Body() dto: GuestConvertRequestDto,
    @Headers('x-guest-session-token') sessionToken?: string,
  ): Promise<GuestConvertResponseDto> {
    return this.guestConversionService.convertGuestSession(dto, sessionToken);
  }
}
