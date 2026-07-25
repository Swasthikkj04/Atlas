import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { RateLimiterGuard } from './rate-limiter.guard';
import { RateLimiterService } from './rate-limiter.service';

@Global()
@Module({
  providers: [
    RateLimiterService,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
  exports: [RateLimiterService],
})
export class RateLimitingModule {}
