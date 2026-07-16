import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateDomainDto } from './dto/create-domain.dto';
import { DomainsService } from './domains.service';

@Controller('domains')
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(
    private readonly domainsService: DomainsService,
  ) {}

  @Post()
  create(
    @Req() request: Request,
    @Body() dto: CreateDomainDto,
  ) {
    return this.domainsService.create({
      userId: (request.user as any).id,
      domainName: dto.domainName,
    });
  }

  @Get()
  findAll(@Req() request: Request) {
    return this.domainsService.findByUser(
      (request.user as any).id,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    return this.domainsService.delete(
      id,
      (request.user as any).id,
    );
  }
}