import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { WorkspaceBriefDto } from '../dto/workspace-brief.dto';
import { WorkspaceDashboardDto } from '../dto/workspace-dashboard.dto';
import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { WorkspaceExperienceService } from '../services/workspace-experience.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Workspace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceExperienceService: WorkspaceExperienceService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get synthesized Workspace Overview for an authenticated domain',
    description:
      'Returns authoritative synthesized domain intelligence including Executive Brief, Primary Story, Secondary Stories, Latest Snapshot, Recent Changes, and Quiet State.',
  })
  @ApiQuery({
    name: 'domainId',
    description: 'Domain ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace overview retrieved successfully.',
  })
  async getWorkspaceOverview(
    @Req() req: AuthenticatedRequest,
    @Query('domainId') domainId: string,
  ) {
    return this.workspaceExperienceService.getWorkspaceOverview(
      req.user.id,
      domainId,
    );
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get Workspace Dashboard & Domain Overview Experience',
    description:
      'Aggregates workspace health, findings, active domains, recent changes, activity feed, and quick actions into a single Experience API response (<300ms).',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace dashboard data retrieved successfully.',
    type: WorkspaceDashboardDto,
  })
  async getWorkspaceDashboard(
    @Req() req: AuthenticatedRequest,
  ): Promise<WorkspaceDashboardDto> {
    return this.workspaceExperienceService.getDashboardData(req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get workspace dashboard data',
    description:
      'Returns aggregated workspace sections (welcome, overview, health, activity, changes, critical findings, and recent domains) for the frontend dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace dashboard data retrieved successfully.',
    type: WorkspaceResponseDto,
  })
  async getWorkspace(
    @Req() req: AuthenticatedRequest,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceExperienceService.getWorkspaceData(req.user);
  }

  @Get('brief')
  @ApiOperation({
    summary: 'Get workspace dashboard overview',
    description:
      'Returns the aggregated workspace summary used to power the Atlas dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace overview retrieved successfully.',
    type: WorkspaceBriefDto,
  })
  async getWorkspaceBrief(
    @Req() req: AuthenticatedRequest,
  ): Promise<WorkspaceBriefDto> {
    return this.workspaceExperienceService.getWorkspaceBrief(req.user.id);
  }
}
