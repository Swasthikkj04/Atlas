import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { SearchExperienceService } from '../services/search-experience.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

@ApiTags('Global Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchExperienceService: SearchExperienceService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Perform global search',
    description:
      'Searches across domains, findings, timeline changes, infrastructure briefs, and activity logs with deterministic relevance scoring and ordering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully.',
    type: SearchResponseDto,
  })
  async search(
    @Req() req: AuthenticatedRequest,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    return this.searchExperienceService.search(
      req.user.id,
      query,
    );
  }
}
