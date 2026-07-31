import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InfrastructureBriefService } from '../services/infrastructure-brief.service';

@ApiTags('Infrastructure Briefs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('snapshots')
export class InfrastructureBriefController {
  constructor(private readonly briefService: InfrastructureBriefService) {}

  @Get(':snapshotId/brief')
  @ApiOperation({
    summary: 'Get infrastructure brief for snapshot',
    description:
      'Retrieves the generated executive infrastructure brief and health score for a specific infrastructure snapshot.',
  })
  @ApiParam({
    name: 'snapshotId',
    description: 'Infrastructure Snapshot ID',
    example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Infrastructure brief retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 404,
    description: 'Infrastructure snapshot or brief not found.',
  })
  async getBySnapshot(@Param('snapshotId') snapshotId: string) {
    return this.briefService.getBySnapshot(snapshotId);
  }

  @Post(':snapshotId/brief')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate infrastructure brief for snapshot',
    description:
      'Generates a new executive infrastructure brief aggregating health findings, overall security posture, and critical highlights for a snapshot.',
  })
  @ApiParam({
    name: 'snapshotId',
    description: 'Infrastructure Snapshot ID',
    example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 201,
    description: 'Infrastructure brief generated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 404,
    description: 'Infrastructure snapshot not found.',
  })
  async generate(
    @Param('snapshotId') snapshotId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const brief = await this.briefService.generate(snapshotId);
    response.setHeader('Location', `/api/v1/snapshots/${snapshotId}/brief`);
    return brief;
  }
}
