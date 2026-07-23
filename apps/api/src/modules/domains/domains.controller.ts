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

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user-interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateDomainDto } from './dto/create-domain.dto';
import { DomainsService } from './domains.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('domains')
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(
    private readonly domainsService: DomainsService,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createDomainDto: CreateDomainDto,
  ) {
    return this.domainsService.create({
      userId: request.user.id,
      domainName: createDomainDto.domainName,
    });
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.domainsService.findByUser(
      request.user.id,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.domainsService.delete(
      request.user.id,
      id,
    );
  }
}