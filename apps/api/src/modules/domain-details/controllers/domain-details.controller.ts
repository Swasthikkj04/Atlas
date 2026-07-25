import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { DomainDetailsDto } from '../dto/domain-details.dto';
import { DomainOverviewResponseDto } from '../dto/domain-overview-response.dto';
import { DomainExperienceService } from '../services/domain-experience.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Domain Details')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('domains')
export class DomainDetailsController {
  constructor(
    private readonly domainExperienceService: DomainExperienceService,
  ) {}

  @Get(':domainId/overview')
  @ApiOperation({
    summary: 'Get domain overview dashboard data',
    description:
      'Returns aggregated domain details including metadata, health score, latest snapshot, brief, findings, changes, verification, infrastructure, and statistics.',
  })
  @ApiParam({
    name: 'domainId',
    description: 'Domain ID',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Domain overview retrieved successfully.',
    type: DomainOverviewResponseDto,
  })
  async getDomainOverview(
    @Req() req: AuthenticatedRequest,
    @Param('domainId') domainId: string,
  ): Promise<DomainOverviewResponseDto> {
    return this.domainExperienceService.getDomainOverview(
      req.user.id,
      domainId,
    );
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get domain details',
    description:
      'Returns the aggregated domain details used by the Atlas Domain Details page.',
  })
  @ApiParam({
    name: 'id',
    description: 'Domain ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Domain details retrieved successfully.',
    type: DomainDetailsDto,
  })
  async getDomainDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') domainId: string,
  ): Promise<DomainDetailsDto> {
    return this.domainExperienceService.getDomainDetails(
      req.user.id,
      domainId,
    );
  }
}