/**
 * Frontend contract for S4 Content Security & Asset Integrity Intelligence.
 */

export const S4_CONTENT_SECURITY_INVARIANTS = {
  S4_CSP_POLICY_ANALYSIS_INTEGRITY: true,
  S4_PERMISSIVE_DIRECTIVE_DETECTION: true,
  S4_CROSS_ORIGIN_ISOLATION_INTEGRITY: true,
  S4_PERMISSIONS_POLICY_HYGIENE_INTEGRITY: true,
  S4_ANTI_OVERREACH_ENFORCEMENT: true,
} as const;

export interface CspDirectivesContractMap {
  [directive: string]: string[];
}

export interface ClientCspObservation {
  present: boolean;
  isReportOnly: boolean;
  rawPolicy?: string;
  hasUnsafeInline: boolean;
  hasUnsafeEval: boolean;
  hasWildcardScript: boolean;
  isStrict: boolean;
  permissiveTokens: string[];
}

export interface ClientCrossOriginIsolationObservation {
  coop?: string;
  coep?: string;
  corp?: string;
  isIsolated: boolean;
}

export interface ClientPermissionsPolicyObservation {
  present: boolean;
  rawHeader?: string;
  restrictedFeatures: string[];
  wildcardFeatures: string[];
  isConfigured: boolean;
}

export interface ClientContentSecurityAssessment {
  domain: string;
  csp: ClientCspObservation;
  crossOriginIsolation: ClientCrossOriginIsolationObservation;
  permissionsPolicy: ClientPermissionsPolicyObservation;
  overallScore: number;
  isCompliant: boolean;
  summary: string;
}

export function evaluateClientContentSecurity(
  domain: string,
  headers: Record<string, string> = {},
): ClientContentSecurityAssessment {
  const getHeader = (name: string): string => {
    const target = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === target) return v;
    }
    return '';
  };

  const rawCsp = getHeader('content-security-policy');
  const rawCspReportOnly = getHeader('content-security-policy-report-only');
  const activeCsp = rawCsp || rawCspReportOnly;
  const isReportOnly = !rawCsp && Boolean(rawCspReportOnly);

  const permissiveTokens: string[] = [];
  let hasUnsafeInline = false;
  let hasUnsafeEval = false;
  let hasWildcardScript = false;
  let isStrict = false;

  if (activeCsp) {
    const lower = activeCsp.toLowerCase();
    if (lower.includes("'unsafe-inline'") && !lower.includes("'strict-dynamic'") && !lower.includes("'nonce-")) {
      hasUnsafeInline = true;
      permissiveTokens.push("'unsafe-inline'");
    }
    if (lower.includes("'unsafe-eval'")) {
      hasUnsafeEval = true;
      permissiveTokens.push("'unsafe-eval'");
    }
    if (lower.includes('script-src *') || lower.includes('default-src *')) {
      hasWildcardScript = true;
      permissiveTokens.push('wildcard-script-source');
    }
    isStrict = !hasUnsafeInline && !hasUnsafeEval && !hasWildcardScript;
  }

  const csp: ClientCspObservation = {
    present: Boolean(activeCsp),
    isReportOnly,
    rawPolicy: activeCsp || undefined,
    hasUnsafeInline,
    hasUnsafeEval,
    hasWildcardScript,
    isStrict,
    permissiveTokens,
  };

  const coop = getHeader('cross-origin-opener-policy');
  const coep = getHeader('cross-origin-embedder-policy');
  const corp = getHeader('cross-origin-resource-policy');
  const isIsolated =
    coop.toLowerCase() === 'same-origin' &&
    (coep.toLowerCase() === 'require-corp' || coep.toLowerCase() === 'credentialless');

  const crossOriginIsolation: ClientCrossOriginIsolationObservation = {
    coop: coop || undefined,
    coep: coep || undefined,
    corp: corp || undefined,
    isIsolated,
  };

  const permHeader = getHeader('permissions-policy') || getHeader('feature-policy');
  const restrictedFeatures: string[] = [];
  const wildcardFeatures: string[] = [];
  if (permHeader) {
    const parts = permHeader.split(',').map((p) => p.trim());
    for (const part of parts) {
      const match = part.match(/^([a-zA-Z0-9_-]+)=(.+)$/);
      if (match) {
        const feature = match[1].toLowerCase();
        const allowlist = match[2].trim();
        if (allowlist === '()' || allowlist === '("self")') {
          restrictedFeatures.push(feature);
        } else if (allowlist === '*' || allowlist === '(*)') {
          wildcardFeatures.push(feature);
        }
      }
    }
  }

  const permissionsPolicy: ClientPermissionsPolicyObservation = {
    present: Boolean(permHeader),
    rawHeader: permHeader || undefined,
    restrictedFeatures,
    wildcardFeatures,
    isConfigured: restrictedFeatures.length > 0,
  };

  let score = 100;
  if (!csp.present) {
    score -= 40;
  } else {
    if (csp.isReportOnly) score -= 15;
    if (csp.hasUnsafeInline) score -= 20;
    if (csp.hasUnsafeEval) score -= 15;
    if (csp.hasWildcardScript) score -= 10;
  }

  if (!crossOriginIsolation.isIsolated) score -= 10;
  if (!permissionsPolicy.isConfigured) score -= 10;

  score = Math.max(0, Math.min(100, score));
  const isCompliant = score >= 80;

  const summary = isCompliant
    ? `Strong content security posture on ${domain} (CSP active & restrained, modern isolation configured)`
    : `Content security posture on ${domain} has hardening gaps (score: ${score}/100)`;

  return {
    domain,
    csp,
    crossOriginIsolation,
    permissionsPolicy,
    overallScore: score,
    isCompliant,
    summary,
  };
}
