import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { SearchController } from './controllers/search.controller';
import { SearchRepository } from './repositories/search.repository';
import { SearchExperienceService } from './services/search-experience.service';
import { SearchQueryService } from './services/search-query.service';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [SearchRepository, SearchQueryService, SearchExperienceService],
  exports: [SearchQueryService, SearchExperienceService],
})
export class SearchModule {}
