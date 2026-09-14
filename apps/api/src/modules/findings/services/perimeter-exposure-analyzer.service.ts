import { Injectable } from '@nestjs/common';
import {
  GitExposureAudit,
  EnvExposureAudit,
  ManagementEndpointAudit,
  PerimeterExposureReport,
} from '../contracts/perimeter-exposure.interface';

@Injectable()
export class PerimeterExposureAnalyzerService {
  analyzePerimeter(snapshot: any): PerimeterExposureReport {
    const http = snapshot?.http || snapshot?.payload?.http || {};
    const reachable = http.reachable !== false;
    const isSuccess =
      http.queryStatus === 'SUCCESS' ||
      (reachable && http.statusCode && http.statusCode < 500);

    const bodyText = typeof http.body === 'string' ? http.body : '';
    const rawPayload = JSON.stringify(
      snapshot?.rawPayload || snapshot?.payload || http,
    );
    const combinedContent = `${bodyText}\n${rawPayload}`;

    const gitAudit = this.evaluateGitExposure(http, combinedContent);
    const envAudit = this.evaluateEnvExposure(http, combinedContent);
    const managementAudit = this.evaluateManagementEndpoints(
      http,
      combinedContent,
    );

    const hasCriticalPerimeterExposure =
      gitAudit.isGitRepoExposed ||
      envAudit.isEnvFileExposed ||
      managementAudit.exposedServices.length > 0;

    const confidence = isSuccess
      ? 'AUTHORITATIVE'
      : reachable
        ? 'SUPPORTED'
        : 'INCONCLUSIVE';

    return {
      gitAudit,
      envAudit,
      managementAudit,
      hasCriticalPerimeterExposure,
      confidence,
      isEvaluated: reachable && isSuccess,
      observedAt: snapshot?.createdAt
        ? new Date(snapshot.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }

  private evaluateGitExposure(http: any, content: string): GitExposureAudit {
    const url = http.url || '';
    const finalUrl = http.finalUrl || '';

    const gitPathPattern = /\/\.git\/(HEAD|config|index)/i;
    const gitHeadMarker = /ref:\s*refs\/heads\/[a-zA-Z0-9_\-\.\/]+/i;
    const gitConfigMarker = /\[core\][\s\S]*?repositoryformatversion/i;

    const hasGitPath =
      gitPathPattern.test(url) || gitPathPattern.test(finalUrl);
    const matchHead = content.match(gitHeadMarker);
    const matchConfig = content.match(gitConfigMarker);

    if (matchHead) {
      return {
        isGitRepoExposed: true,
        refDetected: matchHead[0].trim(),
        matchedPattern: 'ref: refs/heads/*',
        evidenceSnippet: matchHead[0].slice(0, 80),
      };
    }

    if (matchConfig || (hasGitPath && http.statusCode === 200)) {
      return {
        isGitRepoExposed: true,
        refDetected: 'Git repository metadata exposed',
        matchedPattern: '[core] repositoryformatversion',
        evidenceSnippet:
          'Exposed .git configuration repository metadata detected with HTTP status 200.',
      };
    }

    return {
      isGitRepoExposed: false,
    };
  }

  private evaluateEnvExposure(http: any, content: string): EnvExposureAudit {
    const sensitivePatterns: Array<{ name: string; regex: RegExp }> = [
      { name: 'DB_PASSWORD', regex: /DB_PASSWORD\s*=\s*[^\r\n]+/i },
      { name: 'DATABASE_URL', regex: /DATABASE_URL\s*=\s*[^\r\n]+/i },
      {
        name: 'AWS_SECRET_ACCESS_KEY',
        regex: /AWS_SECRET_ACCESS_KEY\s*=\s*[^\r\n]+/i,
      },
      { name: 'APP_KEY', regex: /APP_KEY\s*=\s*base64:[^\r\n]+/i },
      { name: 'JWT_SECRET', regex: /JWT_SECRET\s*=\s*[^\r\n]+/i },
      { name: 'STRIPE_SECRET_KEY', regex: /STRIPE_SECRET_KEY\s*=\s*[^\r\n]+/i },
      { name: 'REDIS_PASSWORD', regex: /REDIS_PASSWORD\s*=\s*[^\r\n]+/i },
    ];

    const detectedKeys: string[] = [];
    let matchedSnippet: string | undefined;

    for (const pattern of sensitivePatterns) {
      const match = content.match(pattern.regex);
      if (match) {
        detectedKeys.push(pattern.name);
        if (!matchedSnippet) {
          matchedSnippet = `${pattern.name}=[REDACTED_SECRET_VALUE]`;
        }
      }
    }

    const url = http.url || '';
    const finalUrl = http.finalUrl || '';
    const isEnvPath = url.includes('/.env') || finalUrl.includes('/.env');

    if (
      detectedKeys.length > 0 ||
      (isEnvPath && http.statusCode === 200 && content.includes('='))
    ) {
      return {
        isEnvFileExposed: true,
        sensitiveKeysDetected:
          detectedKeys.length > 0 ? detectedKeys : ['ENVIRONMENT_CONFIG_KEYS'],
        matchedPattern: '.env key-value definitions',
        evidenceSnippet:
          matchedSnippet ||
          'Publicly readable .env configuration file returned status 200.',
      };
    }

    return {
      isEnvFileExposed: false,
      sensitiveKeysDetected: [],
    };
  }

  private evaluateManagementEndpoints(
    http: any,
    content: string,
  ): ManagementEndpointAudit {
    const exposedServices: string[] = [];
    let evidenceSnippet: string | undefined;

    const url = (http.url || '').toLowerCase();
    const finalUrl = (http.finalUrl || '').toLowerCase();

    // 1. Prometheus / OpenMetrics
    const isPrometheus =
      url.endsWith('/metrics') ||
      finalUrl.endsWith('/metrics') ||
      content.includes('process_cpu_seconds_total') ||
      content.includes('go_goroutines') ||
      (content.includes('# HELP ') && http.statusCode === 200);
    if (isPrometheus) {
      exposedServices.push('Prometheus Metrics (/metrics)');
      evidenceSnippet = '# HELP / # TYPE OpenMetrics payload exposed publicly';
    }

    // 2. Spring Boot Actuator
    const isActuator =
      url.includes('/actuator') ||
      finalUrl.includes('/actuator') ||
      (content.includes('_links') && content.includes('actuator')) ||
      content.includes('actuator/health') ||
      content.includes('actuator/heapdump');
    if (isActuator) {
      exposedServices.push('Spring Boot Actuator (/actuator)');
      evidenceSnippet =
        evidenceSnippet ||
        'Spring Boot Actuator management endpoints accessible without authentication';
    }

    // 3. Swagger / OpenAPI UI
    const isSwagger =
      url.includes('swagger-ui') ||
      finalUrl.includes('swagger-ui') ||
      url.endsWith('/openapi.json') ||
      url.endsWith('/v2/api-docs') ||
      url.endsWith('/v3/api-docs') ||
      ((content.includes('"openapi":"3.') ||
        content.includes('"swagger":"2.')) &&
        http.statusCode === 200);
    if (isSwagger) {
      exposedServices.push('Swagger/OpenAPI Interface');
      evidenceSnippet =
        evidenceSnippet ||
        'Interactive Swagger/OpenAPI documentation exposed publicly';
    }

    // 4. GraphQL Introspection
    const isGraphql =
      (content.includes('__schema') && content.includes('queryType')) ||
      (content.includes('__type') && content.includes('enumValues'));
    if (isGraphql) {
      exposedServices.push('GraphQL Introspection Query');
      evidenceSnippet =
        evidenceSnippet ||
        'GraphQL __schema schema introspection returned full query and type graph';
    }

    return {
      isMetricsExposed: exposedServices.some((s) => s.includes('Prometheus')),
      isActuatorExposed: exposedServices.some((s) => s.includes('Actuator')),
      isSwaggerExposed: exposedServices.some((s) => s.includes('Swagger')),
      isGraphqlIntrospectionExposed: exposedServices.some((s) =>
        s.includes('GraphQL'),
      ),
      exposedServices,
      evidenceSnippet,
    };
  }
}
