import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
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

import { FindingDetailDto } from '../dto/finding-detail.dto';
import { FindingsListDto } from '../dto/findings-list.dto';
import { FindingsQueryDto } from '../dto/findings-query.dto';
import { InfrastructureFindingService } from '../services/infrastructure-finding.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Findings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('findings')
export class FindingController {
  constructor(private readonly findingService: InfrastructureFindingService) {}

  @Get()
  @ApiOperation({
    summary: 'Get filtered & paginated findings experience list',
    description:
      'Returns a paginated list of infrastructure findings for the authenticated user with filters for domainId, severity, category, state, confidence, and search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Findings retrieved successfully.',
    type: FindingsListDto,
  })
  async getFindings(
    @Req() req: AuthenticatedRequest,
    @Query() query: FindingsQueryDto,
  ): Promise<FindingsListDto> {
    return this.findingService.getFindingsExperienceList(req.user.id, query);
  }

  @Get(':findingId')
  @ApiOperation({
    summary: 'Get complete finding explainability payload',
    description:
      'Returns a complete, evidence-backed explainability payload for a finding including executive summary, rule information, canonical observations, evidence links, timeline context, and deterministic recommendations.',
  })
  @ApiParam({
    name: 'findingId',
    description: 'Infrastructure finding ID.',
    example: 'find-http-missing-hsts-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Finding explainability details retrieved successfully.',
    type: FindingDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Finding not found.',
  })
  async getFindingDetail(
    @Req() req: AuthenticatedRequest,
    @Param('findingId') findingId: string,
  ): Promise<FindingDetailDto> {
    return this.findingService.getFindingExplainabilityDetail(
      req.user.id,
      findingId,
    );
  }

  @Get('/snapshots/:snapshotId/findings')
  @ApiOperation({
    summary: 'Get findings associated with a snapshot',
    description:
      'Retrieves a paginated list of findings associated with a specific snapshot ID.',
  })
  @ApiParam({
    name: 'snapshotId',
    description: 'Infrastructure Snapshot ID',
    example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Findings for snapshot retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  async getFindingsBySnapshot(
    @Param('snapshotId') snapshotId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.findingService.getFindingsBySnapshot(snapshotId, page, limit);
  }
}
