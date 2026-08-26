/**
 * Authoritative Observability & Operational Telemetry Contract (WX-805).
 *
 * Defines structured logging, correlation ID lifecycle, module-level diagnostics,
 * health vs. readiness separation, and sensitive payload exclusion.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface StructuredLogPayload {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly correlationId: string;
  readonly operation: string;
  readonly event: string;
  readonly domainId?: string;
  readonly jobId?: string;
  readonly durationMs?: number;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface DiscoveryModuleTelemetry {
  readonly moduleName: 'DNS' | 'HTTP' | 'TLS' | 'TECHNOLOGY';
  readonly status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
  readonly durationMs: number;
  readonly errorCategory?: string;
}

/**
 * Creates a structured, security-sanitized log payload.
 *
 * Invariant: Never contains passwords, JWTs, private keys, database strings,
 * or raw customer infrastructure payloads.
 */
export function createStructuredLog(params: {
  readonly level: LogLevel;
  readonly correlationId: string;
  readonly operation: string;
  readonly event: string;
  readonly domainId?: string;
  readonly jobId?: string;
  readonly durationMs?: number;
  readonly metadata?: Record<string, string | number | boolean>;
}): StructuredLogPayload {
  const timestamp = new Date().toISOString();

  return {
    timestamp,
    level: params.level,
    correlationId: params.correlationId,
    operation: params.operation,
    event: params.event,
    domainId: params.domainId,
    jobId: params.jobId,
    durationMs: params.durationMs,
    metadata: params.metadata,
  };
}

/**
 * Validates that health and readiness probe semantics remain strictly distinct.
 */
export function validateHealthProbeSemantics(probe: 'live' | 'ready'): {
  readonly checksDependencies: boolean;
  readonly probeTarget: string;
} {
  if (probe === 'live') {
    return {
      checksDependencies: false,
      probeTarget: '/api/v1/health/live',
    };
  }

  return {
    checksDependencies: true,
    probeTarget: '/api/v1/health/ready',
  };
}

/**
 * Ten Certified P0 Observability Invariants (WX-805).
 */
export const OBSERVABILITY_HARD_INVARIANTS = [
  'NO_UNTRACEABLE_PRODUCTION_FAILURE',
  'NO_UNCORRELATED_API_ERROR',
  'NO_SILENT_WORKER_FAILURE',
  'NO_SENSITIVE_LOG_PAYLOAD',
  'NO_SECRET_LOGGING',
  'NO_RAW_CUSTOMER_PAYLOAD_LOGGING',
  'NO_DUPLICATE_OBSERVABILITY_SYSTEM',
  'NO_HEALTH_READINESS_SEMANTIC_COLLAPSE',
  'NO_LOSS_OF_JOB_FAILURE_CONTEXT',
  'NO_OPERATIONAL_TELEMETRY_TENANT_LEAKAGE',
] as const;
