import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

import { UnderstandingService } from './understanding.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class UnderstandingController {
  constructor(
    private readonly understandingService: UnderstandingService,
  ) {}

  @Post('domains/:domainId/understand')
  create(
    @Req() request: AuthenticatedRequest,
    @Param('domainId') domainId: string,
  ) {
    return this.understandingService.create(
      request.user.id,
      domainId,
    );
  }

  @Get('jobs/:jobId')
  findById(
    @Req() request: AuthenticatedRequest,
    @Param('jobId') jobId: string,
  ) {
    return this.understandingService.findById(
      request.user.id,
      jobId,
    );
  }

  @Get('domains/:domainId/jobs')
  findByDomain(
    @Req() request: AuthenticatedRequest,
    @Param('domainId') domainId: string,
  ) {
    return this.understandingService.findByDomain(
      request.user.id,
      domainId,
    );
  }
}