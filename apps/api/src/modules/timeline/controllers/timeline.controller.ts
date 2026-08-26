import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { TimelineDetailDto } from '../dto/timeline-detail.dto';
import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { TimelineResponseDto } from '../dto/timeline-response.dto';
import { TimelineExperienceService } from '../services/timeline-experience.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Timeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timeline')
export class TimelineController {
  constructor(
    private readonly timelineExperienceService: TimelineExperienceService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get infrastructure timeline changes',
    description:
      'Returns a cursor-paginated list of historical infrastructure changes for the user, with filters for severity, module, category, changeType, and date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline changes retrieved successfully.',
    type: TimelineResponseDto,
  })
  async getTimeline(
    @Req() req: AuthenticatedRequest,
    @Query() query: TimelineQueryDto,
  ): Promise<TimelineResponseDto> {
    return this.timelineExperienceService.getTimelineData(req.user.id, query);
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get infrastructure timeline event details',
    description:
      'Returns deep explainability details for a timeline event including rule metadata, canonical observations, raw evidence pointers, and snapshot comparison references.',
  })
  @ApiParam({
    name: 'id',
    description: 'Timeline event ID.',
    example: 'evt-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline event details retrieved successfully.',
    type: TimelineDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Timeline event not found.',
  })
  async getTimelineEventDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TimelineDetailDto> {
    return this.timelineExperienceService.getTimelineEventDetails(
      req.user.id,
      id,
    );
  }

  @Get(':id/evidence')
  @ApiOperation({
    summary: 'Get observation evidence and lineage for timeline change',
    description:
      'Returns authoritative observed facts and underlying protocol evidence lineage for a change event, preserving progressive disclosure and domain tenant isolation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Timeline change ID.',
    example: 'evt-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Observation evidence retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Timeline change not found.',
  })
  async getTimelineEventEvidence(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<any> {
    return this.timelineExperienceService.getTimelineEventEvidence(
      req.user.id,
      id,
    );
  }
}
