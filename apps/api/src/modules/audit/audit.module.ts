import { Global, Module } from '@nestjs/common';
import { WorkspaceAuditService } from './services/workspace-audit.service';

@Global()
@Module({
  providers: [WorkspaceAuditService],
  exports: [WorkspaceAuditService],
})
export class AuditModule {}
