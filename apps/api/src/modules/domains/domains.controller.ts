import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user-interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateDomainDto } from './dto/create-domain.dto';
import { DomainResponseDto } from './dto/domain-response.dto';
import { DomainsService } from './domains.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@ApiTags('Domains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new domain for monitoring',
    description:
      'Adds a domain to the authenticated user workspace for automated monitoring and infrastructure discovery.',
  })
  @ApiResponse({
    status: 201,
    description: 'Domain registered successfully for monitoring.',
    type: DomainResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid domain name format or missing fields.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Domain is already registered by user.',
  })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createDomainDto: CreateDomainDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<DomainResponseDto> {
    const domain = await this.domainsService.create({
      userId: request.user.id,
      domainName: createDomainDto.domainName,
    });
    response.setHeader('Location', `/api/v1/domains/${domain.id}`);
    return domain;
  }

  @Get()
  @ApiOperation({
    summary: 'List user domains',
    description:
      'Retrieves all monitored domains belonging to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User domains retrieved successfully.',
    type: [DomainResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  async findAll(
    @Req() request: AuthenticatedRequest,
  ): Promise<DomainResponseDto[]> {
    return this.domainsService.findByUser(request.user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete domain from workspace',
    description:
      'Removes a monitored domain and all associated snapshots, findings, and history for the user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Domain ID (UUID)',
    example: '3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1',
  })
  @ApiResponse({
    status: 200,
    description: 'Domain deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  @ApiResponse({
    status: 404,
    description: 'Domain not found.',
  })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.domainsService.delete(request.user.id, id);
    return { success: true, message: 'Domain deleted successfully.' };
  }
}
