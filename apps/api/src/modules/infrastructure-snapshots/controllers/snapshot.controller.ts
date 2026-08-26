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
import { InfrastructureSnapshotService } from '../services/infrastructure-snapshot.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Infrastructure Snapshots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SnapshotController {
  constructor(
    private readonly snapshotService: InfrastructureSnapshotService,
  ) {}

  @Get('domains/:domainId/snapshots')
  @ApiOperation({
    summary: 'List historical snapshots for domain',
    description:
      'Retrieves a paginated list of immutable infrastructure snapshots captured for a target domain.',
  })
  @ApiParam({
    name: 'domainId',
    description: 'Domain ID',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Snapshots retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 404,
    description: 'Domain or snapshots not found.',
  })
  async getSnapshotsByDomain(
    @Req() req: AuthenticatedRequest,
    @Param('domainId') domainId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.snapshotService.getSnapshotsByDomain(
      req.user.id,
      domainId,
      page,
      limit,
    );
  }

  @Get('snapshots/:snapshotId')
  @ApiOperation({
    summary: 'Get infrastructure snapshot details',
    description:
      'Retrieves complete raw and normalized state details for a specific infrastructure snapshot.',
  })
  @ApiParam({
    name: 'snapshotId',
    description: 'Snapshot ID',
    example: 'snp-3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Snapshot details retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 404,
    description: 'Snapshot not found.',
  })
  async getSnapshotById(
    @Req() req: AuthenticatedRequest,
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.snapshotService.getSnapshotById(req.user.id, snapshotId);
  }
}
