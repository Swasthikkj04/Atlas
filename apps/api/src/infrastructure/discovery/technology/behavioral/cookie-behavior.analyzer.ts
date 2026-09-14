import { Injectable, Logger } from '@nestjs/common';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  BehavioralSignal,
} from '../contracts';

/**
 * T22-B — Cookie Structural Signals Analyzer
 *
 * Treats cookies as structural wire evidence rather than absolute application proof:
 * - Session cookie naming patterns & prefixes
 * - Framework & runtime structural tokens
 * - Security attributes and domain/path boundaries
 * - Ingress & load balancer affinity markers
 */
@Injectable()
export class CookieBehaviorAnalyzer {
  private readonly logger = new Logger(CookieBehaviorAnalyzer.name);

  analyze(context: TechnologyDetectionContext): BehavioralSignal[] {
    const signals: BehavioralSignal[] = [];
    const rawSetCookie = context.getHeader('set-cookie') || '';
    const rawLower = rawSetCookie.toLowerCase();

    // 1. Java Servlet Specification: JSESSIONID
    if (context.hasCookie('jsessionid') || rawLower.includes('jsessionid')) {
      signals.push({
        id: `sig-cookie-java-jsessionid-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-jsessionid-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'MEDIUM',
        description:
          'Java Servlet Specification session cookie identifier (JSESSIONID) observed',
        evidenceReferences: ['Response Header: Set-Cookie: JSESSIONID'],
        targetTechnologyId: 'tech-java',
        targetTechnologyName: 'Java',
        targetCategory: TechnologyCategory.RUNTIME,
        targetLayer: 'RUNTIME',
        targetRole: 'Server-side JVM Application Runtime',
        observationState: 'OBSERVED',
        observedWireEvidence: 'Set-Cookie: JSESSIONID',
        metadata: { cookieName: 'JSESSIONID' },
      });
    }

    // 2. Microsoft ASP.NET & .NET Core Session / Auth Cookies
    if (
      rawLower.includes('.aspnetcore') ||
      rawLower.includes('.aspxauth') ||
      rawLower.includes('asp.net_sessionid') ||
      context.hasCookie('.aspnetcore.cookies') ||
      context.hasCookie('asp.net_sessionid')
    ) {
      const match = rawSetCookie.match(
        /(\.AspNetCore\.[a-zA-Z0-9_-]+|\.ASPXAUTH|ASP\.NET_SessionId)/i,
      );
      const matchedCookie = match ? match[1] : '.AspNetCore.Cookies';

      signals.push({
        id: `sig-cookie-dotnet-aspnet-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-dotnet-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: `Microsoft ASP.NET / .NET Core runtime authentication cookie structure (${matchedCookie})`,
        evidenceReferences: [`Response Header: Set-Cookie: ${matchedCookie}`],
        targetTechnologyId: 'tech-dotnet',
        targetTechnologyName: '.NET',
        targetCategory: TechnologyCategory.RUNTIME,
        targetLayer: 'RUNTIME',
        targetRole: 'Server-side Application Runtime / .NET Environment',
        observationState: 'OBSERVED',
        observedWireEvidence: `Set-Cookie: ${matchedCookie}`,
        metadata: { cookieName: matchedCookie },
      });
    }

    // 3. Node.js Connect / Express Session: connect.sid
    if (context.hasCookie('connect.sid') || rawLower.includes('connect.sid')) {
      signals.push({
        id: `sig-cookie-node-connectsid-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-connectsid-${context.domainName}`,
        strength: 0.9,
        confidence: 0.7,
        confidenceLevel: 'MEDIUM',
        description:
          'Node.js Connect/Express session cookie identifier (connect.sid) observed on response wire',
        evidenceReferences: ['Response Header: Set-Cookie: connect.sid'],
        targetTechnologyId: 'tech-nodejs',
        targetTechnologyName: 'Node.js',
        targetCategory: TechnologyCategory.RUNTIME,
        targetLayer: 'RUNTIME',
        targetRole: 'Server-side JavaScript Runtime',
        observationState: 'OBSERVED',
        observedWireEvidence: 'Set-Cookie: connect.sid',
        metadata: { cookieName: 'connect.sid' },
      });
    }

    // 4. PHP Standard Session Identifier: PHPSESSID
    if (context.hasCookie('phpsessid') || rawLower.includes('phpsessid')) {
      signals.push({
        id: `sig-cookie-php-phpsessid-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-phpsessid-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'MEDIUM',
        description:
          'PHP standard runtime session identifier (PHPSESSID) observed on response wire',
        evidenceReferences: ['Response Header: Set-Cookie: PHPSESSID'],
        targetTechnologyId: 'tech-php',
        targetTechnologyName: 'PHP',
        targetCategory: TechnologyCategory.RUNTIME,
        targetLayer: 'RUNTIME',
        targetRole: 'Server-side PHP Execution Runtime',
        observationState: 'OBSERVED',
        observedWireEvidence: 'Set-Cookie: PHPSESSID',
        metadata: { cookieName: 'PHPSESSID' },
      });
    }

    // 5. Python Django Dual Session: csrftoken + sessionid
    if (
      (context.hasCookie('csrftoken') && context.hasCookie('sessionid')) ||
      (rawLower.includes('csrftoken') && rawLower.includes('sessionid'))
    ) {
      signals.push({
        id: `sig-cookie-django-session-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-django-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'MEDIUM',
        description:
          'Django canonical dual-cookie session and CSRF protection pattern (csrftoken + sessionid)',
        evidenceReferences: [
          'Response Header: Set-Cookie: csrftoken',
          'Response Header: Set-Cookie: sessionid',
        ],
        targetTechnologyId: 'tech-django',
        targetTechnologyName: 'Django',
        targetCategory: TechnologyCategory.FRAMEWORK,
        targetLayer: 'APPLICATION',
        targetRole: 'Python Web Framework',
        observationState: 'OBSERVED',
        observedWireEvidence: 'Set-Cookie: csrftoken & sessionid',
        metadata: { cookies: ['csrftoken', 'sessionid'] },
      });
    }

    // 6. AWS Application Load Balancer Session Affinity: AWSALB / AWSALBCORS
    if (
      rawLower.includes('awsalb') ||
      context.hasCookie('awsalb') ||
      context.hasCookie('awsalbcors')
    ) {
      signals.push({
        id: `sig-cookie-aws-alb-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-awsalb-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description:
          'AWS Application Load Balancer (ALB) sticky routing session cookie structure',
        evidenceReferences: ['Response Header: Set-Cookie: AWSALB'],
        targetTechnologyId: 'tech-aws',
        targetTechnologyName: 'Amazon Web Services (AWS)',
        targetCategory: TechnologyCategory.CLOUD_INFRASTRUCTURE,
        targetLayer: 'GATEWAY',
        targetRole: 'Cloud Ingress & Infrastructure',
        observationState: 'OBSERVED',
        observedWireEvidence: 'Set-Cookie: AWSALB',
        metadata: { cookieName: 'AWSALB' },
      });
    }

    // 7. Cloudflare Edge Security & Bot Management: __cf_bm / cf_clearance
    if (
      rawLower.includes('__cf_bm') ||
      rawLower.includes('cf_clearance') ||
      context.hasCookie('__cf_bm')
    ) {
      signals.push({
        id: `sig-cookie-cf-bm-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-cfbm-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description:
          'Cloudflare bot management & perimeter challenge cookie structure (__cf_bm / cf_clearance)',
        evidenceReferences: ['Response Header: Set-Cookie: __cf_bm'],
        targetTechnologyId: 'tech-cloudflare',
        targetTechnologyName: 'Cloudflare',
        targetCategory: TechnologyCategory.CDN_EDGE,
        targetLayer: 'EDGE',
        targetRole: 'Edge Delivery & Anycast Proxy',
        observationState: 'OBSERVED',
        observedWireEvidence: 'Set-Cookie: __cf_bm',
        metadata: { cookieName: '__cf_bm' },
      });
    }

    // 8. Azure Application Gateway & App Service ARR Affinity: ApplicationGatewayAffinity / ARRAffinity
    if (
      rawLower.includes('applicationgatewayaffinity') ||
      rawLower.includes('arraffinity') ||
      context.hasCookie('applicationgatewayaffinity') ||
      context.hasCookie('applicationgatewayaffinitycors') ||
      context.hasCookie('arraffinity') ||
      context.hasCookie('arraffinitysamesite')
    ) {
      const isAppGw =
        rawLower.includes('applicationgatewayaffinity') ||
        context.hasCookie('applicationgatewayaffinity') ||
        context.hasCookie('applicationgatewayaffinitycors');
      const cookieName = isAppGw ? 'ApplicationGatewayAffinity' : 'ARRAffinity';

      signals.push({
        id: `sig-cookie-azure-affinity-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-azure-${context.domainName}`,
        strength: 0.95,
        confidence: 0.8,
        confidenceLevel: 'HIGH',
        description: isAppGw
          ? 'Azure Application Gateway sticky routing session cookie structure (ApplicationGatewayAffinity)'
          : 'Azure App Service Application Request Routing (ARR) sticky session cookie structure (ARRAffinity)',
        evidenceReferences: [`Response Header: Set-Cookie: ${cookieName}`],
        targetTechnologyId: 'tech-azure',
        targetTechnologyName: 'Microsoft Azure',
        targetCategory: TechnologyCategory.CLOUD_INFRASTRUCTURE,
        targetLayer: 'GATEWAY',
        targetRole: isAppGw
          ? 'Application Gateway / Reverse Proxy'
          : 'Cloud Infrastructure & Managed Services',
        observationState: 'OBSERVED',
        observedWireEvidence: `Set-Cookie: ${cookieName}`,
        metadata: { cookieName },
      });
    }

    // 8. HAProxy Server Persistence Cookie: SERVERID or SRV
    if (
      context.hasCookie('serverid') ||
      context.hasCookie('srv') ||
      /serverid=/i.test(rawLower)
    ) {
      signals.push({
        id: `sig-cookie-haproxy-${context.domainName}`,
        category: 'COOKIE',
        type: 'COOKIE_SEMANTIC_FINGERPRINT',
        observationId: `obs-cookie-haproxy-${context.domainName}`,
        strength: 0.9,
        confidence: 0.75,
        confidenceLevel: 'HIGH',
        description:
          'HAProxy load-balancing backend persistence cookie structure (SERVERID / SRV)',
        evidenceReferences: ['Response Header: Set-Cookie: SERVERID'],
        targetTechnologyId: 'tech-haproxy',
        targetTechnologyName: 'HAProxy',
        targetCategory: TechnologyCategory.WEB_SERVER,
        targetLayer: 'GATEWAY',
        targetRole: 'Reverse Proxy / Load Balancer',
        observationState: 'OBSERVED',
        observedWireEvidence: 'Set-Cookie: SERVERID',
        metadata: { cookieName: 'SERVERID' },
      });
    }

    return signals;
  }
}
