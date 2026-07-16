import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'atlas-api',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
    };
  }
}