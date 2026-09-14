/**
 * Certified S6 Frontend Contracts for HTTP Transit & Transit Invariants.
 */

export const S6_HTTP_TRANSIT_INVARIANTS = {
  S6_CORS_WILDCARD_CREDENTIALS_PROTECTION: true,
  S6_DANGEROUS_METHODS_EXPOSURE_DETECTION: true,
  S6_CLEARTEXT_UPGRADE_REDIRECTION_ENFORCEMENT: true,
  S6_EVIDENCE_LINEAGE_PRESERVATION: true,
  S6_CONSERVATIVE_CLASSIFICATION: true,
} as const;

export interface WebCorsPolicyAudit {
  allowOrigin?: string;
  allowCredentials?: boolean;
  allowMethods?: string[];
  allowHeaders?: string[];
  maxAge?: number;
  isWildcardWithCredentials: boolean;
  isOverlyPermissive: boolean;
}

export interface WebAllowedMethodsAudit {
  declaredMethods: string[];
  hasTraceMethod: boolean;
  hasConnectMethod: boolean;
  hasDangerousMethods: boolean;
  dangerousMethodsList: string[];
}

export interface WebCleartextUpgradeAudit {
  initialProtocol?: string;
  initialStatusCode?: number;
  isHttpsRedirectEnforced: boolean;
  isPermanentRedirect: boolean;
  redirectLocation?: string;
  finalProtocol?: string;
  hasCleartextExposure: boolean;
  explanation: string;
}

export interface WebHttpTransitSecurityReport {
  corsAudit: WebCorsPolicyAudit;
  methodsAudit: WebAllowedMethodsAudit;
  upgradeAudit: WebCleartextUpgradeAudit;
  confidence: 'AUTHORITATIVE' | 'SUPPORTED' | 'INCONCLUSIVE';
  isEvaluated: boolean;
  observedAt: string;
}

export function evaluateClientHttpTransitSecurity(
  headers: Record<string, string> = {},
  redirectHops: Array<{ scheme?: string; statusCode?: number; location?: string; url?: string }> = [],
  protocol = 'https',
  statusCode = 200,
  reachable = true,
): WebHttpTransitSecurityReport {
  const normHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (typeof v === 'string') {
      normHeaders[k.toLowerCase()] = v;
    }
  }

  // 1. CORS
  const rawOrigin = normHeaders['access-control-allow-origin']?.trim();
  const rawCredentials = normHeaders['access-control-allow-credentials']?.trim().toLowerCase() === 'true';
  const rawMethods = normHeaders['access-control-allow-methods']
    ? normHeaders['access-control-allow-methods'].split(',').map((m) => m.trim().toUpperCase()).filter(Boolean)
    : undefined;

  const isWildcardWithCredentials = rawOrigin === '*' && rawCredentials === true;
  const isOverlyPermissive = rawOrigin === '*' || isWildcardWithCredentials || rawOrigin === 'null';

  const corsAudit: WebCorsPolicyAudit = {
    allowOrigin: rawOrigin,
    allowCredentials: rawCredentials,
    allowMethods: rawMethods,
    isWildcardWithCredentials,
    isOverlyPermissive,
  };

  // 2. Methods
  const allowHeader = normHeaders['allow'] || normHeaders['public'] || normHeaders['access-control-allow-methods'];
  const declaredMethods = allowHeader
    ? allowHeader.split(',').map((m) => m.trim().toUpperCase()).filter(Boolean)
    : [];

  const dangerousCandidates = ['TRACE', 'CONNECT', 'TRACK'];
  const dangerousMethodsList = declaredMethods.filter((m) => dangerousCandidates.includes(m));
  const hasTraceMethod = declaredMethods.includes('TRACE') || declaredMethods.includes('TRACK');
  const hasConnectMethod = declaredMethods.includes('CONNECT');
  const hasDangerousMethods = dangerousMethodsList.length > 0;

  const methodsAudit: WebAllowedMethodsAudit = {
    declaredMethods,
    hasTraceMethod,
    hasConnectMethod,
    hasDangerousMethods,
    dangerousMethodsList,
  };

  // 3. Cleartext Upgrade
  let upgradeAudit: WebCleartextUpgradeAudit;
  if (redirectHops.length > 0) {
    const firstHop = redirectHops[0];
    const initProto = firstHop.scheme || (firstHop.url?.startsWith('https') ? 'https' : 'http');
    const initStatus = firstHop.statusCode || 200;
    const loc = firstHop.location;
    const lastHop = redirectHops[redirectHops.length - 1];
    const finProto = lastHop.scheme || (lastHop.url?.startsWith('https') ? 'https' : 'http');

    if (initProto === 'http') {
      const isPermanent = initStatus === 301 || initStatus === 308;
      const redirectsToHttps = typeof loc === 'string' && loc.trim().toLowerCase().startsWith('https://');

      if (initStatus >= 200 && initStatus < 300) {
        upgradeAudit = {
          initialProtocol: 'http',
          initialStatusCode: initStatus,
          isHttpsRedirectEnforced: false,
          isPermanentRedirect: false,
          redirectLocation: loc,
          finalProtocol: finProto,
          hasCleartextExposure: true,
          explanation: `Cleartext HTTP (port 80) returned status ${initStatus} directly without redirecting to HTTPS.`,
        };
      } else {
        upgradeAudit = {
          initialProtocol: 'http',
          initialStatusCode: initStatus,
          isHttpsRedirectEnforced: redirectsToHttps && finProto === 'https',
          isPermanentRedirect: isPermanent,
          redirectLocation: loc,
          finalProtocol: finProto,
          hasCleartextExposure: !(redirectsToHttps && finProto === 'https'),
          explanation: `Cleartext HTTP redirected to HTTPS via status ${initStatus}.`,
        };
      }
    } else {
      upgradeAudit = {
        initialProtocol: 'https',
        initialStatusCode: initStatus,
        isHttpsRedirectEnforced: true,
        isPermanentRedirect: true,
        finalProtocol: finProto,
        hasCleartextExposure: false,
        explanation: 'Initial scheme was HTTPS.',
      };
    }
  } else {
    upgradeAudit = {
      initialProtocol: protocol,
      initialStatusCode: statusCode,
      isHttpsRedirectEnforced: protocol === 'https',
      isPermanentRedirect: true,
      finalProtocol: protocol,
      hasCleartextExposure: protocol === 'http',
      explanation: protocol === 'https' ? 'HTTPS enforced.' : 'HTTP cleartext status unresolved.',
    };
  }

  return {
    corsAudit,
    methodsAudit,
    upgradeAudit,
    confidence: reachable ? 'AUTHORITATIVE' : 'INCONCLUSIVE',
    isEvaluated: reachable,
    observedAt: new Date().toISOString(),
  };
}
