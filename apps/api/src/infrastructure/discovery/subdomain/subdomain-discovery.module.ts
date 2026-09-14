import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SubdomainDiscoveryService } from './subdomain-discovery.service';
import { SubdomainTakeoverAnalyzerService } from './services/subdomain-takeover-analyzer.service';
import { SubdomainDiscoveryController } from './controllers/subdomain-discovery.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SubdomainDiscoveryController],
  providers: [SubdomainDiscoveryService, SubdomainTakeoverAnalyzerService],
  exports: [SubdomainDiscoveryService, SubdomainTakeoverAnalyzerService],
})
export class SubdomainDiscoveryModule {}
