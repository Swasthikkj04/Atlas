import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { InfrastructureFindingService } from '../services/infrastructure-finding.service';

@Controller()
export class FindingController {
  constructor(
    private readonly findingService: InfrastructureFindingService,
  ) {}

  @Get('/snapshots/:snapshotId/findings')
  async getFindingsBySnapshot(
    @Param('snapshotId') snapshotId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.findingService.getFindingsBySnapshot(
      snapshotId,
      page,
      limit,
    );
  }
}