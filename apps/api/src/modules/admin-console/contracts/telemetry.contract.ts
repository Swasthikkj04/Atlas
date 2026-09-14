import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/**
 * ADMIN-002: Security Telemetry & Action Beacons Contracts
 *
 * Observational product telemetry plane distinct from authoritative security audit trail.
 * Enforces strict DTO validation, event allowlisting, metadata allowlisting,
 * sensitive secret rejection, and domain normalization.
 */

export const TELEMETRY_EVENTS = [
  'SCAN_DOMAIN_CTA',
  'SIGN_UP_CTA',
  'SCAN_DOMAIN',
  'CLAIM_SESSION',
  'SIGN_IN',
  'SIGN_OUT',
  'AUTH_FAILURE',
  'PAGE_VIEW',
  'EXPLORE_DOCS_CTA',
  'NAVIGATE',
  // ADMIN-003: Browser Tab Presence & Session Lifecycle Telemetry
  // FREEZE INVARIANT: SESSION_TAB_CLOSED ≠ SESSION_REVOKED
  // Browser presence is observational telemetry. Session revocation is authoritative security state.
  'SESSION_TAB_OPENED',
  'SESSION_TAB_VISIBLE',
  'SESSION_TAB_HIDDEN',
  'SESSION_TAB_CLOSED',
] as const;

export type TelemetryEventType = (typeof TELEMETRY_EVENTS)[number];

export const FORBIDDEN_SENSITIVE_KEYS = [
  'password',
  'pass',
  'pwd',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'cookies',
  'sessiontoken',
  'privatekey',
  'credential',
  'credentials',
  'clientsecret',
  'token',
  'secret',
  'key',
  'hash',
  'bearer',
  'authheader',
  'userpassword',
] as const;

/**
 * Allowlisted metadata fields with strict bounds.
 */
export class TelemetryEventMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  submittedDomain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ctaLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  section?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  surface?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tabInstanceId?: string;
}

/**
 * Single telemetry event payload.
 */
export class RecordTelemetryEventDto {
  @IsString()
  @IsIn(TELEMETRY_EVENTS, {
    message: `Event must be one of the allowlisted telemetry events: ${TELEMETRY_EVENTS.join(', ')}`,
  })
  event!: TelemetryEventType;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timestamp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  surface?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TelemetryEventMetadataDto)
  metadata?: TelemetryEventMetadataDto;
}

/**
 * Batch telemetry events payload.
 */
export class RecordTelemetryBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordTelemetryEventDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  events!: RecordTelemetryEventDto[];
}

export class TelemetryIngestResponseDto {
  success!: boolean;
  ingested!: number;
  eventIds?: string[];
  status?: string;
}

/**
 * Privacy & normalization helper functions for Telemetry Plane.
 */
export class TelemetryPrivacyBoundary {
  private static readonly DOMAIN_REGEX =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

  /**
   * Asserts that no forbidden sensitive keys or tokens are present anywhere in the object tree.
   * Throws BadRequestException if sensitive fields are detected.
   */
  public static assertNoSensitiveData(obj: any, depth = 0): void {
    if (!obj || typeof obj !== 'object' || depth > 3) {
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.assertNoSensitiveData(item, depth + 1);
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
      const isForbidden = FORBIDDEN_SENSITIVE_KEYS.some((forbidden) =>
        normalizedKey.includes(forbidden),
      );

      if (isForbidden) {
        throw new BadRequestException(
          `Privacy Violation: Sensitive telemetry metadata key '${key}' is forbidden.`,
        );
      }

      // Check values for possible token / key strings
      const val = obj[key];
      if (typeof val === 'string') {
        const valLower = val.toLowerCase();
        if (
          valLower.startsWith('eyj') && // JWT header base64 ({"alg":...)
          val.split('.').length === 3 &&
          val.length > 50
        ) {
          throw new BadRequestException(
            `Privacy Violation: JWT or auth token detected in telemetry metadata field '${key}'.`,
          );
        }
      }

      if (val && typeof val === 'object') {
        this.assertNoSensitiveData(val, depth + 1);
      }
    }
  }

  /**
   * Sanitizes and normalizes submitted domain according to RFC rules.
   * Strips protocols, trailing paths, query strings, and port numbers.
   */
  public static normalizeDomain(rawDomain?: string): string | undefined {
    if (!rawDomain || typeof rawDomain !== 'string') {
      return undefined;
    }

    let clean = rawDomain.trim().toLowerCase();
    // Strip protocols
    clean = clean.replace(/^(?:https?:\/\/|wss?:\/\/|ftp:\/\/)/i, '');
    // Strip trailing path/query/fragment
    clean = clean.split('/')[0].split('?')[0].split('#')[0];
    // Strip port
    clean = clean.split(':')[0];
    // Strip credentials
    if (clean.includes('@')) {
      clean = clean.split('@').pop() || '';
    }
    // Trim leading/trailing dots
    clean = clean.replace(/^\.+|\.+$/g, '');

    if (clean.length === 0 || clean.length > 253) {
      return undefined;
    }

    // Allow valid localhost/local domain in development
    if (
      clean === 'localhost' ||
      clean.endsWith('.local') ||
      clean.endsWith('.internal')
    ) {
      return clean;
    }

    return this.DOMAIN_REGEX.test(clean) ? clean : undefined;
  }
}
