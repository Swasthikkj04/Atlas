/**
 * Certified S7 Frontend Contracts for Well-Known Perimeter & Configuration Exposure.
 */

export const S7_PERIMETER_EXPOSURE_INVARIANTS = {
  S7_GIT_METADATA_EXPOSURE_PREVENTION: true,
  S7_ENV_FILE_SECRET_EXPOSURE_PREVENTION: true,
  S7_MANAGEMENT_ENDPOINT_EXPOSURE_DETECTION: true,
  S7_SECRET_VALUE_REDACTION_INVARIANT: true,
  S7_ZERO_FALSE_POSITIVE_ON_ERROR_STATUS: true,
} as const;

export interface WebGitExposureAudit {
  isGitRepoExposed: boolean;
  refDetected?: string;
  matchedPattern?: string;
  evidenceSnippet?: string;
}

export interface WebEnvExposureAudit {
  isEnvFileExposed: boolean;
  sensitiveKeysDetected: string[];
  matchedPattern?: string;
  evidenceSnippet?: string;
}

export interface WebManagementEndpointAudit {
  isMetricsExposed: boolean;
  isActuatorExposed: boolean;
  isSwaggerExposed: boolean;
  isGraphqlIntrospectionExposed: boolean;
  exposedServices: string[];
  evidenceSnippet?: string;
}

export interface WebPerimeterExposureReport {
  gitAudit: WebGitExposureAudit;
  envAudit: WebEnvExposureAudit;
  managementAudit: WebManagementEndpointAudit;
  hasCriticalPerimeterExposure: boolean;
  confidence: 'AUTHORITATIVE' | 'SUPPORTED' | 'INCONCLUSIVE';
  isEvaluated: boolean;
  observedAt: string;
}

export function evaluateClientPerimeterExposure(
  url = '',
  statusCode = 200,
  body = '',
  reachable = true,
): WebPerimeterExposureReport {
  const isSuccess = reachable && statusCode >= 200 && statusCode < 400;

  // 1. Git check
  const gitHeadMarker = /ref:\s*refs\/heads\/[a-zA-Z0-9_\-\.\/]+/i;
  const matchHead = body.match(gitHeadMarker);
  const isGit = Boolean(matchHead || (url.includes('/.git/') && statusCode === 200));

  const gitAudit: WebGitExposureAudit = {
    isGitRepoExposed: isSuccess && isGit,
    refDetected: matchHead ? matchHead[0].trim() : isGit ? 'Git repository metadata exposed' : undefined,
    matchedPattern: isGit ? 'ref: refs/heads/*' : undefined,
  };

  // 2. Env check
  const sensitivePatterns = ['DB_PASSWORD', 'DATABASE_URL', 'AWS_SECRET_ACCESS_KEY', 'JWT_SECRET'];
  const sensitiveKeysDetected = sensitivePatterns.filter((k) => body.includes(`${k}=`));
  const isEnv = sensitiveKeysDetected.length > 0 || (url.includes('/.env') && statusCode === 200 && body.includes('='));

  const envAudit: WebEnvExposureAudit = {
    isEnvFileExposed: isSuccess && isEnv,
    sensitiveKeysDetected: isSuccess && isEnv ? (sensitiveKeysDetected.length > 0 ? sensitiveKeysDetected : ['ENVIRONMENT_CONFIG_KEYS']) : [],
    matchedPattern: isEnv ? '.env key-value definitions' : undefined,
  };

  // 3. Management Endpoints
  const exposedServices: string[] = [];
  if (isSuccess && (url.endsWith('/metrics') || body.includes('# HELP ') || body.includes('process_cpu_seconds_total'))) {
    exposedServices.push('Prometheus Metrics (/metrics)');
  }
  if (isSuccess && (url.includes('/actuator') || body.includes('actuator/health'))) {
    exposedServices.push('Spring Boot Actuator (/actuator)');
  }
  if (isSuccess && (url.includes('swagger-ui') || body.includes('"openapi":"3.'))) {
    exposedServices.push('Swagger/OpenAPI Interface');
  }
  if (isSuccess && body.includes('__schema') && body.includes('queryType')) {
    exposedServices.push('GraphQL Introspection Query');
  }

  const managementAudit: WebManagementEndpointAudit = {
    isMetricsExposed: exposedServices.some((s) => s.includes('Prometheus')),
    isActuatorExposed: exposedServices.some((s) => s.includes('Actuator')),
    isSwaggerExposed: exposedServices.some((s) => s.includes('Swagger')),
    isGraphqlIntrospectionExposed: exposedServices.some((s) => s.includes('GraphQL')),
    exposedServices,
  };

  const hasCriticalPerimeterExposure = gitAudit.isGitRepoExposed || envAudit.isEnvFileExposed || exposedServices.length > 0;

  return {
    gitAudit,
    envAudit,
    managementAudit,
    hasCriticalPerimeterExposure,
    confidence: isSuccess ? 'AUTHORITATIVE' : 'INCONCLUSIVE',
    isEvaluated: reachable,
    observedAt: new Date().toISOString(),
  };
}
