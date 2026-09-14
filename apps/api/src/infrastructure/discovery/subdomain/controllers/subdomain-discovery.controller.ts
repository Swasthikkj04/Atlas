import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../modules/auth/guards/jwt-auth.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubdomainDiscoveryService } from '../subdomain-discovery.service';

@ApiTags('Subdomains & Attack Surface')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('domains/:id/subdomains')
export class SubdomainDiscoveryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subdomainService: SubdomainDiscoveryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get discovered subdomains & attack surface posture',
    description:
      'Returns all discovered subdomains, environment classifications, and takeover risks for the given domain.',
  })
  @ApiParam({ name: 'id', description: 'Domain UUID' })
  @ApiResponse({
    status: 200,
    description: 'Subdomains retrieved successfully.',
  })
  async getSubdomains(@Param('id', ParseUUIDPipe) domainId: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new NotFoundException(`Domain with ID ${domainId} not found`);
    }

    return this.subdomainService.discoverSubdomains(domain.domainName);
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger on-demand subdomain perimeter enumeration',
    description:
      'Performs an active multi-source subdomain discovery and takeover audit.',
  })
  @ApiParam({ name: 'id', description: 'Domain UUID' })
  @ApiResponse({
    status: 200,
    description: 'Subdomain scan completed successfully.',
  })
  async triggerScan(@Param('id', ParseUUIDPipe) domainId: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new NotFoundException(`Domain with ID ${domainId} not found`);
    }

    return this.subdomainService.discoverSubdomains(domain.domainName);
  }
}
