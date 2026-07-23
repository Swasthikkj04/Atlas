import { Controller, Get, Post, Param } from '@nestjs/common';

import { InfrastructureBriefService } from '../services/infrastructure-brief.service';

@Controller()
export class InfrastructureBriefController {
  constructor(
    private readonly briefService: InfrastructureBriefService,
  ) {}

  @Get('/snapshots/:snapshotId/brief')
  async getBySnapshot(
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.briefService.getBySnapshot(snapshotId);
  }

  @Post('/snapshots/:snapshotId/brief')
  async generate(
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.briefService.generate(snapshotId);
  }
}