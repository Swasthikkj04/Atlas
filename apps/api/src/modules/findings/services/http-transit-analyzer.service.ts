import { Injectable } from '@nestjs/common';
import {
  CorsPolicyAudit,
  AllowedMethodsAudit,
  CleartextUpgradeAudit,
  HttpTransitSecurityReport,
} from '../contracts/http-transit.interface';

@Injectable()
export class HttpTransitAnalyzerService {
  analyzeTransit(snapshot: any): HttpTransitSecurityReport {
    const http = snapshot?.http || snapshot?.payload?.http || {};
    const headers: Record<string, string> = {};

    // Normalize header keys to lowercase
    if (http.headers && typeof http.headers === 'object') {
      for (const [k, v] of Object.entries(http.headers)) {
        if (typeof v === 'string') {
          headers[k.toLowerCase()] = v;
        }
      }
    }

    const reachable = http.reachable !== false;
    const isSuccess =
      http.queryStatus === 'SUCCESS' ||
      (reachable && http.statusCode && http.statusCode < 500);

    const corsAudit = this.evaluateCorsPolicy(headers);
    const methodsAudit = this.evaluateAllowedMethods(headers);
    const upgradeAudit = this.evaluateCleartextUpgrade(http, headers);

    const confidence = isSuccess
      ? 'AUTHORITATIVE'
      : reachable
        ? 'SUPPORTED'
        : 'INCONCLUSIVE';

    return {
      corsAudit,
      methodsAudit,
      upgradeAudit,
      confidence,
      isEvaluated: reachable && isSuccess,
      observedAt: snapshot?.createdAt
        ? new Date(snapshot.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }

  private evaluateCorsPolicy(headers: Record<string, string>): CorsPolicyAudit {
    const rawOrigin = headers['access-control-allow-origin'];
    const rawCredentials = headers['access-control-allow-credentials'];
    const rawMethods = headers['access-control-allow-methods'];
    const rawHeaders = headers['access-control-allow-headers'];
    const rawMaxAge = headers['access-control-max-age'];

    const allowOrigin = rawOrigin?.trim();
    const allowCredentials = rawCredentials
      ? rawCredentials.trim().toLowerCase() === 'true'
      : false;

    const allowMethods = rawMethods
      ? rawMethods
          .split(',')
          .map((m) => m.trim().toUpperCase())
          .filter(Boolean)
      : undefined;

    const allowHeaders = rawHeaders
      ? rawHeaders
          .split(',')
          .map((h) => h.trim().toLowerCase())
          .filter(Boolean)
      : undefined;

    const maxAge = rawMaxAge ? parseInt(rawMaxAge.trim(), 10) : undefined;

    const isWildcardWithCredentials =
      allowOrigin === '*' && allowCredentials === true;
    const isNullOriginWithCredentials =
      allowOrigin === 'null' && allowCredentials === true;
    const isOverlyPermissive =
      allowOrigin === '*' ||
      isWildcardWithCredentials ||
      isNullOriginWithCredentials;

    return {
      allowOrigin,
      allowCredentials,
      allowMethods,
      allowHeaders,
      maxAge: Number.isNaN(maxAge) ? undefined : maxAge,
      isWildcardWithCredentials,
      isOverlyPermissive,
      rawOriginHeader: rawOrigin,
      rawCredentialsHeader: rawCredentials,
    };
  }

  private evaluateAllowedMethods(
    headers: Record<string, string>,
  ): AllowedMethodsAudit {
    const allowHeader =
      headers['allow'] ||
      headers['public'] ||
      headers['access-control-allow-methods'];
    const declaredMethods: string[] = [];

    if (allowHeader) {
      const parts = allowHeader
        .split(',')
        .map((m) => m.trim().toUpperCase())
        .filter(Boolean);
      for (const p of parts) {
        if (!declaredMethods.includes(p)) {
          declaredMethods.push(p);
        }
      }
    }

    const dangerousCandidates = ['TRACE', 'CONNECT', 'TRACK'];
    const dangerousMethodsList = declaredMethods.filter((m) =>
      dangerousCandidates.includes(m),
    );

    const hasTraceMethod =
      declaredMethods.includes('TRACE') || declaredMethods.includes('TRACK');
    const hasConnectMethod = declaredMethods.includes('CONNECT');
    const hasDangerousMethods = dangerousMethodsList.length > 0;

    return {
      declaredMethods,
      hasTraceMethod,
      hasConnectMethod,
      hasDangerousMethods,
      dangerousMethodsList,
      rawHeader: allowHeader,
    };
  }

  private evaluateCleartextUpgrade(
    http: any,
    finalHeaders: Record<string, string>,
  ): CleartextUpgradeAudit {
    const hops = Array.isArray(http.redirectHops) ? http.redirectHops : [];
    const protocol =
      http.protocol || (http.url?.startsWith('https') ? 'https' : 'http');
    const statusCode = http.statusCode;

    // Case 1: Trace available from initial plain HTTP hop
    if (hops.length > 0) {
      const firstHop = hops[0];
      const initialProtocol =
        firstHop.scheme ||
        (firstHop.url?.startsWith('https') ? 'https' : 'http');
      const initialStatusCode = firstHop.statusCode;
      const location =
        firstHop.location ||
        firstHop.headers?.['location'] ||
        firstHop.headers?.['Location'];
      const lastHop = hops[hops.length - 1];
      const finalProtocol =
        lastHop.scheme || (lastHop.url?.startsWith('https') ? 'https' : 'http');

      if (initialProtocol === 'http') {
        const isPermanent =
          initialStatusCode === 301 || initialStatusCode === 308;
        const redirectsToHttps =
          typeof location === 'string' &&
          location.trim().toLowerCase().startsWith('https://');
        const finalIsHttps = finalProtocol === 'https';

        if (initialStatusCode >= 200 && initialStatusCode < 300) {
          return {
            initialProtocol: 'http',
            initialStatusCode,
            isHttpsRedirectEnforced: false,
            isPermanentRedirect: false,
            redirectLocation: location,
            finalProtocol,
            hasCleartextExposure: true,
            explanation: `Cleartext HTTP (port 80) returned status ${initialStatusCode} directly without redirecting to HTTPS.`,
          };
        }

        if (redirectsToHttps && finalIsHttps) {
          return {
            initialProtocol: 'http',
            initialStatusCode,
            isHttpsRedirectEnforced: true,
            isPermanentRedirect: isPermanent,
            redirectLocation: location,
            finalProtocol: 'https',
            hasCleartextExposure: false,
            explanation: `Cleartext HTTP successfully redirected to HTTPS via status ${initialStatusCode}${isPermanent ? ' (Permanent)' : ' (Temporary)'}.`,
          };
        }
      }
    }

    // Case 2: Final response evaluation if no hops recorded
    if (protocol === 'http' && statusCode >= 200 && statusCode < 400) {
      return {
        initialProtocol: 'http',
        initialStatusCode: statusCode,
        isHttpsRedirectEnforced: false,
        isPermanentRedirect: false,
        finalProtocol: 'http',
        hasCleartextExposure: true,
        explanation: `Endpoint responded over cleartext HTTP with status ${statusCode} without redirecting to HTTPS.`,
      };
    }

    return {
      initialProtocol: protocol,
      initialStatusCode: statusCode,
      isHttpsRedirectEnforced: protocol === 'https',
      isPermanentRedirect: true,
      finalProtocol: protocol,
      hasCleartextExposure: protocol === 'http',
      explanation:
        protocol === 'https'
          ? 'HTTPS transport is actively enforced.'
          : 'HTTP cleartext status unresolved.',
    };
  }
}
