import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { ActivityQueryDto } from '../dto/activity-query.dto';
import { ActivityResponseDto } from '../dto/activity-response.dto';
import { ActivityExperienceService } from '../services/activity-experience.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(
    private readonly activityExperienceService: ActivityExperienceService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get workspace activity feed',
    description:
      'Returns a cross-domain cursor-paginated activity feed aggregating timeline changes, verifications, job completions, and critical findings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity feed retrieved successfully.',
    type: ActivityResponseDto,
  })
  async getActivity(
    @Req() req: AuthenticatedRequest,
    @Query() query: ActivityQueryDto,
  ): Promise<ActivityResponseDto> {
    return this.activityExperienceService.getActivityData(req.user.id, query);
  }
}
