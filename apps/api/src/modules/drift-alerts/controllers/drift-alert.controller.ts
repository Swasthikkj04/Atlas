import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { RequireWorkspacePermission } from '../../../common/security/rbac/require-permission.decorator';
import { WorkspacePermissionGuard } from '../../../common/security/rbac/workspace-permission.guard';
import { WorkspacePermission } from '../../../common/security/rbac/workspace-rbac.types';
import { DriftAlertService } from '../services/drift-alert.service';
import { DriftAlertDto } from '../dto/drift-alert.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Drift Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspacePermissionGuard)
@Controller()
export class DriftAlertController {
  constructor(private readonly driftAlertService: DriftAlertService) {}

  @Get('domains/:domainId/drift-alerts')
  @RequireWorkspacePermission(WorkspacePermission.DOMAIN_READ)
  @ApiOperation({
    summary: 'Get active and historical drift alerts for domain',
    description:
      'Retrieves all infrastructure configuration drift alerts detected for a target domain.',
  })
  @ApiParam({ name: 'domainId', description: 'Domain ID' })
  @ApiResponse({
    status: 200,
    description: 'Drift alerts retrieved successfully.',
    type: [DriftAlertDto],
  })
  async getDomainAlerts(
    @Req() req: AuthenticatedRequest,
    @Param('domainId') domainId: string,
  ): Promise<DriftAlertDto[]> {
    return this.driftAlertService.getAlertsByDomain(req.user.id, domainId);
  }

  @Get('workspace/drift-alerts')
  @RequireWorkspacePermission(WorkspacePermission.DOMAIN_READ)
  @ApiOperation({
    summary: 'Get workspace-wide active drift alerts',
    description:
      'Retrieves all active infrastructure drift alerts across all domains in the workspace.',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace drift alerts retrieved successfully.',
    type: [DriftAlertDto],
  })
  async getWorkspaceAlerts(
    @Req() req: AuthenticatedRequest,
  ): Promise<DriftAlertDto[]> {
    return this.driftAlertService.getWorkspaceAlerts(req.user.id);
  }

  @Patch('domains/:domainId/drift-alerts/:alertId/ack')
  @RequireWorkspacePermission(WorkspacePermission.DOMAIN_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Acknowledge an infrastructure drift alert',
    description:
      'Marks an active drift alert as acknowledged by the current workspace user.',
  })
  @ApiParam({ name: 'domainId', description: 'Domain ID' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiResponse({
    status: 200,
    description: 'Drift alert acknowledged successfully.',
    type: DriftAlertDto,
  })
  async acknowledgeAlert(
    @Req() req: AuthenticatedRequest,
    @Param('domainId') domainId: string,
    @Param('alertId') alertId: string,
  ): Promise<DriftAlertDto> {
    return this.driftAlertService.acknowledgeAlert(
      req.user.id,
      domainId,
      alertId,
    );
  }

  @Patch('domains/:domainId/drift-alerts/:alertId/resolve')
  @RequireWorkspacePermission(WorkspacePermission.DOMAIN_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve an infrastructure drift alert',
    description: 'Marks a drift alert as resolved.',
  })
  @ApiParam({ name: 'domainId', description: 'Domain ID' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiResponse({
    status: 200,
    description: 'Drift alert resolved successfully.',
    type: DriftAlertDto,
  })
  async resolveAlert(
    @Req() req: AuthenticatedRequest,
    @Param('domainId') domainId: string,
    @Param('alertId') alertId: string,
  ): Promise<DriftAlertDto> {
    return this.driftAlertService.resolveAlert(req.user.id, domainId, alertId);
  }
}
