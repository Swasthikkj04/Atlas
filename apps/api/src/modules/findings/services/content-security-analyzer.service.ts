import { Injectable } from '@nestjs/common';
import {
  CspDirectivesMap,
  NormalizedCspObservation,
  NormalizedCrossOriginIsolationObservation,
  NormalizedPermissionsPolicyObservation,
  ContentSecurityPostureAssessment,
} from '../contracts/content-security.interface';

@Injectable()
export class ContentSecurityAnalyzerService {
  /**
   * Parse a raw CSP string into structured directive map and flags.
   */
  parseCspDirectives(
    rawPolicy: string,
    isReportOnly = false,
  ): NormalizedCspObservation {
    const directives: CspDirectivesMap = {};
    const permissiveTokens: string[] = [];

    if (!rawPolicy || typeof rawPolicy !== 'string') {
      return {
        present: false,
        isReportOnly: false,
        directives: {},
        hasUnsafeInline: false,
        hasUnsafeEval: false,
        hasWildcardScript: false,
        hasMissingObjectSrc: true,
        hasMissingBaseUri: true,
        isStrict: false,
        permissiveTokens: [],
      };
    }

    const chunks = rawPolicy
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean);
    for (const chunk of chunks) {
      const parts = chunk.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        const directiveName = parts[0].toLowerCase();
        const directiveValues = parts.slice(1);
        directives[directiveName] = directiveValues;
      }
    }

    const scriptSources =
      directives['script-src'] || directives['default-src'] || [];
    const hasUnsafeInline = scriptSources.some(
      (s) => s.toLowerCase() === "'unsafe-inline'",
    );
    const hasUnsafeEval = scriptSources.some(
      (s) => s.toLowerCase() === "'unsafe-eval'",
    );
    const hasWildcardScript = scriptSources.some(
      (s) => s === '*' || s.toLowerCase() === 'http:',
    );
    const hasStrictDynamic = scriptSources.some(
      (s) => s.toLowerCase() === "'strict-dynamic'",
    );
    const hasNonceOrHash = scriptSources.some(
      (s) =>
        s.startsWith("'nonce-") ||
        s.startsWith("'sha256-") ||
        s.startsWith("'sha384-") ||
        s.startsWith("'sha512-"),
    );

    if (hasUnsafeInline && !hasStrictDynamic && !hasNonceOrHash) {
      permissiveTokens.push("'unsafe-inline'");
    }
    if (hasUnsafeEval) {
      permissiveTokens.push("'unsafe-eval'");
    }
    if (hasWildcardScript) {
      permissiveTokens.push('wildcard-script-source');
    }

    const hasExplicitObjectSrc = Boolean(directives['object-src']);
    const hasMissingObjectSrc =
      !hasExplicitObjectSrc &&
      (!directives['default-src'] || directives['default-src'].length === 0);
    const hasMissingBaseUri = !directives['base-uri'];

    const isStrict =
      !hasUnsafeInline &&
      !hasUnsafeEval &&
      !hasWildcardScript &&
      (Boolean(directives['script-src']) || Boolean(directives['default-src']));

    return {
      present: true,
      isReportOnly,
      rawPolicy,
      directives,
      hasUnsafeInline,
      hasUnsafeEval,
      hasWildcardScript,
      hasMissingObjectSrc,
      hasMissingBaseUri,
      isStrict,
      permissiveTokens,
    };
  }

  /**
   * Analyze Content-Security-Policy headers from raw HTTP header map.
   */
  analyzeCsp(
    headers: Record<string, string | string[]> = {},
  ): NormalizedCspObservation {
    const cspHeader = this.getHeaderValue(headers, 'content-security-policy');
    const cspReportOnly = this.getHeaderValue(
      headers,
      'content-security-policy-report-only',
    );

    if (cspHeader) {
      return this.parseCspDirectives(cspHeader, false);
    }
    if (cspReportOnly) {
      return this.parseCspDirectives(cspReportOnly, true);
    }

    return {
      present: false,
      isReportOnly: false,
      directives: {},
      hasUnsafeInline: false,
      hasUnsafeEval: false,
      hasWildcardScript: false,
      hasMissingObjectSrc: true,
      hasMissingBaseUri: true,
      isStrict: false,
      permissiveTokens: [],
    };
  }

  /**
   * Analyze Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy.
   */
  analyzeCrossOriginIsolation(
    headers: Record<string, string | string[]> = {},
  ): NormalizedCrossOriginIsolationObservation {
    const coop = this.getHeaderValue(headers, 'cross-origin-opener-policy');
    const coep = this.getHeaderValue(headers, 'cross-origin-embedder-policy');
    const corp = this.getHeaderValue(headers, 'cross-origin-resource-policy');

    const isIsolated =
      coop?.toLowerCase() === 'same-origin' &&
      (coep?.toLowerCase() === 'require-corp' ||
        coep?.toLowerCase() === 'credentialless');

    return {
      coop: coop || undefined,
      coep: coep || undefined,
      corp: corp || undefined,
      isIsolated,
    };
  }

  /**
   * Analyze Permissions-Policy / Feature-Policy.
   */
  analyzePermissionsPolicy(
    headers: Record<string, string | string[]> = {},
  ): NormalizedPermissionsPolicyObservation {
    const rawHeader =
      this.getHeaderValue(headers, 'permissions-policy') ||
      this.getHeaderValue(headers, 'feature-policy');

    if (!rawHeader) {
      return {
        present: false,
        restrictedFeatures: [],
        wildcardFeatures: [],
        isConfigured: false,
      };
    }

    const restrictedFeatures: string[] = [];
    const wildcardFeatures: string[] = [];

    const directives = rawHeader
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    for (const directive of directives) {
      const match = directive.match(/^([a-zA-Z0-9_-]+)=(.+)$/);
      if (match) {
        const feature = match[1].toLowerCase();
        const allowlist = match[2].trim();
        if (
          allowlist === '()' ||
          allowlist === '("self")' ||
          allowlist === "'self'"
        ) {
          restrictedFeatures.push(feature);
        } else if (allowlist === '*' || allowlist === '(*)') {
          wildcardFeatures.push(feature);
        }
      }
    }

    return {
      present: true,
      rawHeader,
      restrictedFeatures,
      wildcardFeatures,
      isConfigured: restrictedFeatures.length > 0,
    };
  }

  /**
   * Assess overall content security posture for a domain snapshot.
   */
  assessContentSecurityPosture(
    domain: string,
    httpData: any,
    snapshotId?: string,
  ): ContentSecurityPostureAssessment {
    const headers = httpData?.finalResponse?.headers || httpData?.headers || {};
    const csp = this.analyzeCsp(headers);
    const crossOriginIsolation = this.analyzeCrossOriginIsolation(headers);
    const permissionsPolicy = this.analyzePermissionsPolicy(headers);

    let score = 100;

    if (!csp.present) {
      score -= 40;
    } else {
      if (csp.isReportOnly) {
        score -= 15;
      }
      if (csp.hasUnsafeInline) {
        score -= 20;
      }
      if (csp.hasUnsafeEval) {
        score -= 15;
      }
      if (csp.hasWildcardScript) {
        score -= 10;
      }
    }

    if (!crossOriginIsolation.isIsolated) {
      score -= 10;
    }

    if (!permissionsPolicy.isConfigured) {
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));
    const isCompliant = score >= 80;

    const summary = isCompliant
      ? `Strong content security posture on ${domain} (CSP active & restrained, modern isolation configured)`
      : `Content security posture on ${domain} has hardening gaps (score: ${score}/100)`;

    return {
      domain,
      snapshotId,
      csp,
      crossOriginIsolation,
      permissionsPolicy,
      overallScore: score,
      isCompliant,
      summary,
    };
  }

  private getHeaderValue(
    headers: Record<string, string | string[]>,
    headerName: string,
  ): string | null {
    const normalizedName = headerName.toLowerCase();
    for (const [key, val] of Object.entries(headers)) {
      if (key.toLowerCase() === normalizedName) {
        if (Array.isArray(val)) {
          return val.join(', ');
        }
        return val;
      }
    }
    return null;
  }
}
