export interface GitExposureAudit {
  readonly isGitRepoExposed: boolean;
  readonly refDetected?: string;
  readonly matchedPattern?: string;
  readonly evidenceSnippet?: string;
}

export interface EnvExposureAudit {
  readonly isEnvFileExposed: boolean;
  readonly sensitiveKeysDetected: string[];
  readonly matchedPattern?: string;
  readonly evidenceSnippet?: string;
}

export interface ManagementEndpointAudit {
  readonly isMetricsExposed: boolean;
  readonly isActuatorExposed: boolean;
  readonly isSwaggerExposed: boolean;
  readonly isGraphqlIntrospectionExposed: boolean;
  readonly exposedServices: string[];
  readonly evidenceSnippet?: string;
}

export interface PerimeterExposureReport {
  readonly gitAudit: GitExposureAudit;
  readonly envAudit: EnvExposureAudit;
  readonly managementAudit: ManagementEndpointAudit;
  readonly hasCriticalPerimeterExposure: boolean;
  readonly confidence: 'AUTHORITATIVE' | 'SUPPORTED' | 'INCONCLUSIVE';
  readonly isEvaluated: boolean;
  readonly observedAt: string;
}
