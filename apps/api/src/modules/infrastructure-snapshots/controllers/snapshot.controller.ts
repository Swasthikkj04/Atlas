import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { InfrastructureSnapshotService } from '../services/infrastructure-snapshot.service';

@Controller()
export class SnapshotController {
  constructor(
    private readonly snapshotService: InfrastructureSnapshotService,
  ) {}

  @Get('/domains/:domainId/snapshots')
  async getSnapshotsByDomain(
    @Param('domainId') domainId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.snapshotService.getSnapshotsByDomain(
      domainId,
      page,
      limit,
    );
  }

  @Get('/snapshots/:snapshotId')
  async getSnapshotById(
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.snapshotService.getSnapshotById(snapshotId);
  }
}