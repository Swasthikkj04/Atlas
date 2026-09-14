import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { VisitorAnalyticsService } from '../services/visitor-analytics.service';
import { RecordVisitDto } from '../contracts/admin-console.contract';
import {
  RecordTelemetryEventDto,
  RecordTelemetryBatchDto,
  TelemetryIngestResponseDto,
  TelemetryPrivacyBoundary,
} from '../contracts/telemetry.contract';
import { RateLimit } from '../../../infrastructure/rate-limiting/rate-limit.decorator';

@Controller('telemetry')
export class TelemetryController {
  constructor(
    private readonly visitorAnalyticsService: VisitorAnalyticsService,
  ) {}

  /**
   * ADMIN-002: Dedicated Telemetry Ingestion Boundary
   * Ingests single or batch action events with strict schema and privacy validation.
   */
  @Post('events')
  @RateLimit({ limit: 180, windowSeconds: 60, name: 'telemetry_ingest' })
  @HttpCode(HttpStatus.OK)
  recordEvents(
    @Body() dto: RecordTelemetryEventDto | RecordTelemetryBatchDto,
    @Req() req: Request,
  ): TelemetryIngestResponseDto {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'];
    const headerCountry = (req.headers['cf-ipcountry'] ||
      req.headers['x-country-code']) as string;

    try {
      // Direct privacy assertion across whole request body
      TelemetryPrivacyBoundary.assertNoSensitiveData(dto);

      if (
        (dto as RecordTelemetryBatchDto).events &&
        Array.isArray((dto as RecordTelemetryBatchDto).events)
      ) {
        return this.visitorAnalyticsService.recordTelemetryEvents(
          (dto as RecordTelemetryBatchDto).events,
          ipAddress,
          userAgent,
          headerCountry,
        );
      } else {
        const res = this.visitorAnalyticsService.recordTelemetryEvent(
          dto as RecordTelemetryEventDto,
          ipAddress,
          userAgent,
          headerCountry,
        );
        return {
          success: res.success,
          ingested: res.success ? 1 : 0,
          eventIds: res.eventId ? [res.eventId] : [],
        };
      }
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      // Production invariant: Telemetry can fail. Nebula cannot.
      return {
        success: true,
        ingested: 0,
        status: 'DEGRADED_ISOLATED',
      };
    }
  }

  /**
   * ADMIN-002: Alias for single event ingestion.
   */
  @Post('event')
  @RateLimit({ limit: 180, windowSeconds: 60, name: 'telemetry_ingest' })
  @HttpCode(HttpStatus.OK)
  recordSingleEvent(
    @Body() dto: RecordTelemetryEventDto,
    @Req() req: Request,
  ): TelemetryIngestResponseDto {
    return this.recordEvents(dto, req);
  }

  /**
   * Legacy beacon endpoint for client-side visitor telemetry.
   */
  @Post('visit')
  @HttpCode(HttpStatus.OK)
  recordVisit(
    @Body() dto: RecordVisitDto,
    @Req() req: Request,
  ): { success: boolean; eventId: string } {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'];
    const headerCountry = (req.headers['cf-ipcountry'] ||
      req.headers['x-country-code']) as string;

    return this.visitorAnalyticsService.recordVisit(
      dto,
      ipAddress,
      userAgent,
      headerCountry,
    );
  }
}
