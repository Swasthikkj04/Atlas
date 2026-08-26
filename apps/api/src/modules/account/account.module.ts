import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PasswordService } from '../auth/services/password.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountController],
  providers: [AccountService, PasswordService],
  exports: [AccountService],
})
export class AccountModule {}
