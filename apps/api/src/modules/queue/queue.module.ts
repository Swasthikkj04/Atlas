import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { QueueController } from './queue.controller';
import { QueueDiagnosticsService } from './services/queue-diagnostics.service';

@Module({
  imports: [PrismaModule],
  controllers: [QueueController],
  providers: [QueueDiagnosticsService],
  exports: [QueueDiagnosticsService],
})
export class QueueModule {}
