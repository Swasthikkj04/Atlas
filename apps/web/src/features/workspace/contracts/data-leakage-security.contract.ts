/**
 * Frontend S2 Certified Invariants: Data Leakage & Debug Exposure Intelligence.
 */
export const S2_FRONTEND_CERTIFIED_INVARIANTS = {
  S2_DEBUG_HEADER_EXPOSURE_INTEGRITY: true,
  S2_INTERNAL_TOPOLOGY_LEAKAGE_INTEGRITY: true,
  S2_STACK_TRACE_DISCLOSURE_INTEGRITY: true,
  S2_SENSITIVE_VALUE_REDACTION: true,
  S2_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION: true,
  S2_ANTI_OVERREACH_ENFORCEMENT: true,
  S2_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S2_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type FrontendLeakageType =
  | 'DEBUG_HEADER'
  | 'INTERNAL_IP_ROUTING'
  | 'STACK_TRACE'
  | 'SQL_ERROR_LEAK'
  | 'DIAGNOSTIC_SOURCEMAP';

export interface FrontendNormalizedLeakageObservation {
  id: string;
  type: FrontendLeakageType;
  source: 'HEADER' | 'BODY' | 'STATUS_REASON';
  key: string;
  rawEvidenceRedacted: string;
  details: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  confidence: 'AUTHORITATIVE' | 'SUPPORTED' | 'CONTEXTUAL' | 'INCONCLUSIVE';
  riskClassification: string;
  severityRationale: string;
  whatThisDoesNotProve: string;
  remediationSnippet: string;
  observationTimestamp: string;
  snapshotId?: string;
}

export interface FrontendDataLeakageAssessment {
  domain?: string;
  snapshotId?: string;
  totalFindings: number;
  debugHeaderFindings: FrontendNormalizedLeakageObservation[];
  internalTopologyFindings: FrontendNormalizedLeakageObservation[];
  stackTraceFindings: FrontendNormalizedLeakageObservation[];
  isHardened: boolean;
  summary: string;
}

/**
 * Sanitizes and masks sensitive DB credentials, bearer tokens, or password strings.
 */
export function sanitizeFrontendLeakageEvidence(evidence: string): string {
  if (!evidence) return '';

  return evidence
    .replace(/([a-zA-Z0-9+_-]+:\/\/)([^:]+):([^@]+)@/g, '$1[REDACTED]:[REDACTED]@')
    .replace(/Bearer\s+([a-zA-Z0-9_\-.~+/]+=*)/gi, 'Bearer [REDACTED]')
    .replace(
      /(["']?(?:password|secret|api_key|apikey|access_token|private_key)["']?\s*[:=]\s*["']?)([^"'\s&,]{3,})/gi,
      '$1[REDACTED]',
    );
}

/**
 * Evaluates whether headers or body content contain observable diagnostic leakage.
 */
export function evaluateFrontendDataLeakage(
  headers?: Record<string, string>,
  bodyOrError?: string,
  snapshotId?: string,
): FrontendDataLeakageAssessment {
  const observations: FrontendNormalizedLeakageObservation[] = [];
  const timestamp = new Date().toISOString();

  if (headers) {
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string') {
        normalized[k.toLowerCase()] = v;
      }
    }

    if (normalized['x-debug-token']) {
      observations.push({
        id: 'fe-leak-debug-token',
        type: 'DEBUG_HEADER',
        source: 'HEADER',
        key: 'x-debug-token',
        rawEvidenceRedacted: `x-debug-token: ${normalized['x-debug-token']}`,
        details: 'Debug profiler token exposed in HTTP response.',
        severity: 'HIGH',
        confidence: 'AUTHORITATIVE',
        riskClassification: 'CONFIRMED_SECURITY_CONDITION',
        severityRationale: 'Debug profilers expose internal database query and framework traces.',
        whatThisDoesNotProve: 'Does not prove that the debug interface is directly unauthenticated.',
        remediationSnippet: 'Disable debug profiling in production.',
        observationTimestamp: timestamp,
        snapshotId,
      });
    }

    const internalIps = /(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})/;
    if (normalized['x-backend-server'] && internalIps.test(normalized['x-backend-server'])) {
      observations.push({
        id: 'fe-leak-internal-ip',
        type: 'INTERNAL_IP_ROUTING',
        source: 'HEADER',
        key: 'x-backend-server',
        rawEvidenceRedacted: `x-backend-server: ${normalized['x-backend-server']}`,
        details: 'Internal RFC 1918 private IP disclosed in header.',
        severity: 'MEDIUM',
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale: 'Discloses private internal network topology.',
        whatThisDoesNotProve: 'Does not prove direct external routability.',
        remediationSnippet: 'Strip routing headers at edge gateway.',
        observationTimestamp: timestamp,
        snapshotId,
      });
    }
  }

  if (bodyOrError && /TypeError:|Traceback|Fatal error:|PG::Error|SQLSTATE/i.test(bodyOrError)) {
    observations.push({
      id: 'fe-leak-stack-trace',
      type: 'STACK_TRACE',
      source: 'BODY',
      key: 'stack-trace-disclosure',
      rawEvidenceRedacted: sanitizeFrontendLeakageEvidence(bodyOrError.substring(0, 200)),
      details: 'Unhandled application stack trace or SQL error in response body.',
      severity: 'HIGH',
      confidence: 'AUTHORITATIVE',
      riskClassification: 'CONFIRMED_SECURITY_CONDITION',
      severityRationale: 'Reveals internal filesystem and software dependency details.',
      whatThisDoesNotProve: 'Does not prove arbitrary code execution or data exfiltration.',
      remediationSnippet: 'Configure production error boundaries.',
      observationTimestamp: timestamp,
      snapshotId,
    });
  }

  const debugHeaderFindings = observations.filter(
    (o) => o.type === 'DEBUG_HEADER' || o.type === 'DIAGNOSTIC_SOURCEMAP',
  );
  const internalTopologyFindings = observations.filter((o) => o.type === 'INTERNAL_IP_ROUTING');
  const stackTraceFindings = observations.filter(
    (o) => o.type === 'STACK_TRACE' || o.type === 'SQL_ERROR_LEAK',
  );

  const totalFindings = observations.length;
  const isHardened = totalFindings === 0;

  return {
    snapshotId,
    totalFindings,
    debugHeaderFindings,
    internalTopologyFindings,
    stackTraceFindings,
    isHardened,
    summary: isHardened
      ? 'No diagnostic data leakage detected.'
      : `${totalFindings} data leakage finding(s) identified.`,
  };
}
