import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { StatisticsResponseDto } from '../dto/statistics-response.dto';
import { StatisticsExperienceService } from '../services/statistics-experience.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Workspace Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace/statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsExperienceService: StatisticsExperienceService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get workspace statistics',
    description:
      'Returns aggregated workspace metrics across domains, findings, changes, verifications, snapshots, and understanding jobs for KPI cards and dashboard charts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace statistics retrieved successfully.',
    type: StatisticsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  async getStatistics(
    @Req() req: AuthenticatedRequest,
  ): Promise<StatisticsResponseDto> {
    return this.statisticsExperienceService.getStatisticsData(req.user.id);
  }
}
