import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user-interface';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { DataRetentionPurgeService } from '../services/data-retention-purge.service';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@ApiTags('Data Retention & Privacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace/retention')
export class DataRetentionController {
  constructor(
    private readonly retentionPurgeService: DataRetentionPurgeService,
  ) {}

  @Get('policy')
  @ApiOperation({
    summary: 'Get workspace retention policy',
    description:
      'Returns the authoritative retention policy window for the workspace tier.',
  })
  @ApiResponse({
    status: 200,
    description: 'Retention policy retrieved successfully.',
  })
  getRetentionPolicy(@Req() req: AuthenticatedRequest) {
    const tier = (req.user as any)?.tier || 'FREE';
    return {
      tier,
      policy: this.retentionPurgeService.getTierPolicy(tier),
    };
  }

  @Get('footprint')
  @ApiOperation({
    summary: 'Get storage footprint & aging metrics',
    description:
      'Returns evidence count, storage footprint in bytes, oldest evidence date, and reclaimable bytes.',
  })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Storage footprint retrieved successfully.',
  })
  async getStorageFootprint(
    @Req() req: AuthenticatedRequest,
    @Query('domainId') domainId?: string,
  ) {
    const tier = (req.user as any)?.tier || 'FREE';
    return this.retentionPurgeService.getStorageFootprint(domainId, tier);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview expired records purge (Dry-run)',
    description:
      'Calculates how many records and bytes would be purged without executing deletion.',
  })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Purge preview generated successfully.',
  })
  async previewPurge(
    @Req() req: AuthenticatedRequest,
    @Query('domainId') domainId?: string,
  ) {
    const tier = (req.user as any)?.tier || 'FREE';
    return this.retentionPurgeService.purgeExpiredRawEvidence({
      domainId,
      tier,
      dryRun: true,
    });
  }

  @Post('purge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute on-demand lifecycle purge',
    description:
      'Purges all expired raw evidence according to workspace retention policy and returns cryptographic audit proof.',
  })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Purge executed successfully.' })
  async executePurge(
    @Req() req: AuthenticatedRequest,
    @Query('domainId') domainId?: string,
  ) {
    const tier = (req.user as any)?.tier || 'FREE';
    return this.retentionPurgeService.purgeExpiredRawEvidence({
      domainId,
      tier,
      dryRun: false,
    });
  }
}
