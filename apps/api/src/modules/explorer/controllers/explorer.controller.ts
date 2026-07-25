import {
  Controller,
  Get,
  Param,
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

import { ExplorerQueryDto } from '../dto/explorer-query.dto';
import { InfrastructureAssetDetailDto } from '../dto/infrastructure-asset-detail.dto';
import { InfrastructureExplorerDto } from '../dto/infrastructure-explorer.dto';
import { InfrastructureExplorerExperienceService } from '../services/explorer-experience.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Explorer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('explorer')
export class ExplorerController {
  constructor(
    private readonly explorerExperienceService: InfrastructureExplorerExperienceService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get unified infrastructure asset inventory feed',
    description:
      'Returns a paginated, searchable asset inventory feed across Technologies, DNS, HTTP, TLS, Certificates, Security Headers, and Services (<300ms).',
  })
  @ApiResponse({
    status: 200,
    description: 'Infrastructure assets retrieved successfully.',
    type: InfrastructureExplorerDto,
  })
  async getExplorerAssets(
    @Req() req: AuthenticatedRequest,
    @Query() query: ExplorerQueryDto,
  ): Promise<InfrastructureExplorerDto> {
    return this.explorerExperienceService.getExplorerData(
      req.user.id,
      query,
    );
  }

  @Get(':assetId')
  @ApiOperation({
    summary: 'Get complete infrastructure asset details & Knowledge Graph relationships',
    description:
      'Returns deep asset explainability details including canonical observations, evidence lineage, historical presence, and Knowledge Graph relationships.',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Infrastructure asset ID.',
    example: 'ast-tech-gws-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Infrastructure asset details retrieved successfully.',
    type: InfrastructureAssetDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Infrastructure asset not found.',
  })
  async getAssetDetail(
    @Req() req: AuthenticatedRequest,
    @Param('assetId') assetId: string,
  ): Promise<InfrastructureAssetDetailDto> {
    return this.explorerExperienceService.getAssetDetail(
      req.user.id,
      assetId,
    );
  }
}
