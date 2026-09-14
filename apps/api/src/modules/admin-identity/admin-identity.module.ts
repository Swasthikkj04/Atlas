import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AdminIdentityService } from './services/admin-identity.service';

/**
 * ADMIN-001: Admin Identity Module
 *
 * Dedicated security boundary module providing owner-exclusive Admin identity services.
 */
@Module({
  imports: [PrismaModule],
  providers: [AdminIdentityService],
  exports: [AdminIdentityService],
})
export class AdminIdentityModule {}
