import { Module } from '@nestjs/common';
import { AdminSessionModule } from '../admin-session/admin-session.module';
import { AdminAuthorizationGuard } from './guards/admin-authorization.guard';

@Module({
  imports: [AdminSessionModule],
  providers: [AdminAuthorizationGuard],
  exports: [AdminAuthorizationGuard],
})
export class AdminAuthorizationModule {}
