export interface CorsPolicyAudit {
  readonly allowOrigin?: string;
  readonly allowCredentials?: boolean;
  readonly allowMethods?: string[];
  readonly allowHeaders?: string[];
  readonly maxAge?: number;
  readonly isWildcardWithCredentials: boolean;
  readonly isOverlyPermissive: boolean;
  readonly rawOriginHeader?: string;
  readonly rawCredentialsHeader?: string;
}

export interface AllowedMethodsAudit {
  readonly declaredMethods: string[];
  readonly hasTraceMethod: boolean;
  readonly hasConnectMethod: boolean;
  readonly hasDangerousMethods: boolean;
  readonly dangerousMethodsList: string[];
  readonly rawHeader?: string;
}

export interface CleartextUpgradeAudit {
  readonly initialProtocol?: string;
  readonly initialStatusCode?: number;
  readonly isHttpsRedirectEnforced: boolean;
  readonly isPermanentRedirect: boolean;
  readonly redirectLocation?: string;
  readonly finalProtocol?: string;
  readonly hasCleartextExposure: boolean;
  readonly explanation: string;
}

export interface HttpTransitSecurityReport {
  readonly corsAudit: CorsPolicyAudit;
  readonly methodsAudit: AllowedMethodsAudit;
  readonly upgradeAudit: CleartextUpgradeAudit;
  readonly confidence: 'AUTHORITATIVE' | 'SUPPORTED' | 'INCONCLUSIVE';
  readonly isEvaluated: boolean;
  readonly observedAt: string;
}
