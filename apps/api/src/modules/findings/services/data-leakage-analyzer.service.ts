import { Injectable } from '@nestjs/common';
import { Severity } from '../enums/severity.enum';
import {
  DataLeakageAssessment,
  NormalizedLeakageObservation,
} from '../contracts/data-leakage-security.interface';

@Injectable()
export class DataLeakageAnalyzerService {
  /**
   * RFC 1918 Private IPv4 patterns and link-local ranges
   */
  private readonly PRIVATE_IP_REGEX =
    /(?:^|\b)(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\b|$)/;

  /**
   * Internal hostname suffixes and AWS internal instance hostnames
   */
  private readonly INTERNAL_HOSTNAME_REGEX =
    /(?:\b|\.)(?:internal|local|corp|lan|priv|intranet|localdomain)\b|ip-(?:10|172-(?:1[6-9]|2\d|3[01])|192-168)-\d+-\d+/i;

  /**
   * Stack trace signature regexes across popular runtimes
   */
  private readonly STACK_TRACE_SIGNATURES: Array<{
    name: string;
    regex: RegExp;
    runtime: string;
  }> = [
    {
      name: 'Node.js / V8 Stack Trace',
      regex:
        /(?:at\s+(?:[a-zA-Z0-9_$<>.]+\s+)?\(?(?:\/|[A-Za-z]:\\)[^\s:]+:\d+:\d+\)?|TypeError:|ReferenceError:|SyntaxError:\s+.*?\n\s+at\s+)/i,
      runtime: 'Node.js',
    },
    {
      name: 'Python / Django / Flask Traceback',
      regex:
        /(?:Traceback\s+\(most\s+recent\s+call\s+last\):|File\s+"(?:(?:\/|[A-Za-z]:\\)[^"]+\.py)",\s+line\s+\d+,\s+in\s+)/i,
      runtime: 'Python',
    },
    {
      name: 'PHP / Laravel Stack Trace',
      regex:
        /(?:Fatal\s+error:\s+Uncaught\s+|Stack\s+trace:\s*#\d+\s+(?:\/|[A-Za-z]:\\)|vendor\/laravel\/framework|vendor\/symfony\/)/i,
      runtime: 'PHP',
    },
    {
      name: 'Java / Spring Stack Trace',
      regex:
        /(?:java\.lang\.[A-Za-z]+Exception|at\s+org\.springframework\.[a-zA-Z0-9_.]+\([A-Za-z0-9_.]+\.java:\d+\)|at\s+jakarta\.[a-zA-Z0-9_.]+)/i,
      runtime: 'Java',
    },
    {
      name: 'Ruby on Rails Stack Trace',
      regex:
        /(?:ActionView::Template::Error|ActionController::RoutingError|vendor\/bundle\/gems\/[a-zA-Z0-9_\-.]+)/i,
      runtime: 'Ruby',
    },
    {
      name: 'ASP.NET Core Stack Trace',
      regex:
        /(?:System\.[A-Za-z]+Exception:\s+|at\s+Microsoft\.AspNetCore\.[a-zA-Z0-9_.]+\(.*?\.cs:\d+\))/i,
      runtime: '.NET',
    },
  ];

  /**
   * SQL Error and Query Syntax Disclosure Signatures
   */
  private readonly SQL_ERROR_SIGNATURES: Array<{
    name: string;
    regex: RegExp;
    database: string;
  }> = [
    {
      name: 'PostgreSQL SQL Error',
      regex:
        /(?:PG::Error|ERROR:\s+syntax\s+error\s+at\s+or\s+near|psycopg2\.(?:ProgrammingError|OperationalError)|SQLSTATE\[[0-9A-Z]{5}\])/i,
      database: 'PostgreSQL',
    },
    {
      name: 'MySQL Error Disclosure',
      regex:
        /(?:You\s+have\s+an\s+error\s+in\s+your\s+SQL\s+syntax;\s+check\s+the\s+manual|pymysql\.err\.|mysqli_query\(\))/i,
      database: 'MySQL',
    },
    {
      name: 'Microsoft SQL Server Error',
      regex:
        /(?:Unclosed\s+quotation\s+mark\s+before\s+the\s+character\s+string|Microsoft\s+OLE\s+DB\s+Provider\s+for\s+SQL\s+Server)/i,
      database: 'Microsoft SQL Server',
    },
    {
      name: 'Oracle Database Error',
      regex: /(?:ORA-[0-9]{5}:|Oracle\s+error\s+number:)/i,
      database: 'Oracle',
    },
    {
      name: 'SQLite Error Disclosure',
      regex: /(?:SQLite3::SQLException|sqlite3\.OperationalError:\s+near)/i,
      database: 'SQLite',
    },
  ];

  /**
   * Redacts sensitive secrets, passwords, URIs, and authorization tokens from text.
   */
  public redactSensitiveData(text: string): string {
    if (!text) return '';

    return (
      text
        // Database connection strings: postgres://user:pass@host:5432/db -> postgres://[REDACTED]@host:5432/db
        .replace(
          /([a-zA-Z0-9+_-]+:\/\/)([^:]+):([^@]+)@/g,
          '$1[REDACTED]:[REDACTED]@',
        )
        // Bearer tokens & JWTs
        .replace(/Bearer\s+([a-zA-Z0-9_\-.~+/]+=*)/gi, 'Bearer [REDACTED]')
        // Password / secret / apiKey parameters in URLs or JSON
        .replace(
          /(["']?(?:password|secret|api_key|apikey|access_token|private_key)["']?\s*[:=]\s*["']?)([^"'\s&,]{3,})/gi,
          '$1[REDACTED]',
        )
    );
  }

  /**
   * Inspects response headers for debug tooling, profilers, and internal IP / server disclosures.
   */
  public analyzeHeaders(
    headers: Record<string, any> | undefined | null,
    snapshotId?: string,
    observationTimestamp?: string,
  ): NormalizedLeakageObservation[] {
    if (!headers || typeof headers !== 'object') {
      return [];
    }

    const observations: NormalizedLeakageObservation[] = [];
    const timestamp = observationTimestamp || new Date().toISOString();

    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        normalizedHeaders[key.toLowerCase()] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        normalizedHeaders[key.toLowerCase()] = String(value[0]);
      }
    }

    // 1. Debug Profilers & Toolbars
    if (
      normalizedHeaders['x-debug-token'] ||
      normalizedHeaders['x-debug-token-link']
    ) {
      const token = normalizedHeaders['x-debug-token'] || '';
      const link = normalizedHeaders['x-debug-token-link'] || '';
      observations.push({
        id: `leak-debug-symfony-${token || 'header'}`,
        type: 'DEBUG_HEADER',
        source: 'HEADER',
        key: 'x-debug-token',
        rawEvidenceRedacted: this.redactSensitiveData(
          `x-debug-token: ${token}${link ? ` | x-debug-token-link: ${link}` : ''}`,
        ),
        details:
          'Symfony / Web Profiler debug header exposed in HTTP response.',
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'CONFIRMED_SECURITY_CONDITION',
        severityRationale:
          'Exposing debug tokens or profiler URLs allows attackers to access detailed execution metrics, database queries, and environment details.',
        whatThisDoesNotProve:
          'Exposure of the X-Debug-Token header does not prove the profiler URL is publicly accessible or unauthenticated, but indicates active debug instrumentation.',
        remediationSnippet:
          'Disable the web profiler in production environment (e.g. APP_DEBUG=false or web_profiler.toolbar: false).',
        observationTimestamp: timestamp,
        snapshotId,
      });
    }

    if (
      normalizedHeaders['x-clockwork-id'] ||
      normalizedHeaders['x-clockwork-version']
    ) {
      const id = normalizedHeaders['x-clockwork-id'] || '';
      observations.push({
        id: `leak-debug-clockwork-${id || 'header'}`,
        type: 'DEBUG_HEADER',
        source: 'HEADER',
        key: 'x-clockwork-id',
        rawEvidenceRedacted: `x-clockwork-id: ${id}`,
        details: 'Clockwork PHP debugging and profiling tool header detected.',
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'CONFIRMED_SECURITY_CONDITION',
        severityRationale:
          'Clockwork exposes internal database queries, cache hits, and request logs through diagnostic API endpoints.',
        whatThisDoesNotProve:
          'Does not prove unauthorized access to logs has occurred, but reveals active diagnostic profiling.',
        remediationSnippet:
          'Disable Clockwork in production configuration (CLOCKWORK_ENABLE=false).',
        observationTimestamp: timestamp,
        snapshotId,
      });
    }

    if (normalizedHeaders['x-flare-signature']) {
      observations.push({
        id: 'leak-debug-laravel-flare',
        type: 'DEBUG_HEADER',
        source: 'HEADER',
        key: 'x-flare-signature',
        rawEvidenceRedacted: 'x-flare-signature: [REDACTED]',
        details:
          'Laravel Ignition / Flare error reporting signature header detected.',
        severity: Severity.MEDIUM,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Ignition debug signatures indicate that full interactive error pages may be enabled for error responses.',
        whatThisDoesNotProve:
          'Does not prove remote code execution, but indicates development-mode error handling.',
        remediationSnippet:
          'Ensure APP_DEBUG=false in production Laravel deployments.',
        observationTimestamp: timestamp,
        snapshotId,
      });
    }

    if (normalizedHeaders['x-sourcemap'] || normalizedHeaders['sourcemap']) {
      const mapUrl =
        normalizedHeaders['x-sourcemap'] || normalizedHeaders['sourcemap'];
      observations.push({
        id: 'leak-debug-sourcemap',
        type: 'DIAGNOSTIC_SOURCEMAP',
        source: 'HEADER',
        key: 'x-sourcemap',
        rawEvidenceRedacted: this.redactSensitiveData(`sourcemap: ${mapUrl}`),
        details:
          'SourceMap header reveals location of unminified original source files.',
        severity: Severity.LOW,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'INFORMATIONAL_OBSERVATION',
        severityRationale:
          'Publicly exposed source maps allow reverse-engineering of client application business logic and hidden endpoints.',
        whatThisDoesNotProve:
          'Source map availability does not imply server-side vulnerability.',
        remediationSnippet:
          'Remove SourceMap headers and do not upload .map files to public web roots.',
        observationTimestamp: timestamp,
        snapshotId,
      });
    }

    // 2. Internal IP & Topology Leakage Headers
    const internalRoutingKeys = [
      'x-backend-server',
      'x-origin-ip',
      'x-served-by',
      'x-server-ip',
      'x-real-server',
      'x-upstream',
      'x-host',
    ];

    for (const routingKey of internalRoutingKeys) {
      const headerVal = normalizedHeaders[routingKey];
      if (headerVal) {
        const isPrivateIp = this.PRIVATE_IP_REGEX.test(headerVal);
        const isInternalHost = this.INTERNAL_HOSTNAME_REGEX.test(headerVal);

        if (isPrivateIp || isInternalHost) {
          observations.push({
            id: `leak-topology-${routingKey}`,
            type: 'INTERNAL_IP_ROUTING',
            source: 'HEADER',
            key: routingKey,
            rawEvidenceRedacted: `${routingKey}: ${headerVal}`,
            details: `Internal infrastructure address disclosed in '${routingKey}' header.`,
            severity: Severity.MEDIUM,
            confidence: 'AUTHORITATIVE',
            riskClassification: 'SECURITY_HARDENING_GAP',
            severityRationale:
              'Disclosing private IP addresses (RFC 1918) or internal cluster hostnames assists attackers in mapping internal network boundaries.',
            whatThisDoesNotProve:
              'Disclosing an internal IP address does not prove that the internal host is reachable directly from the public internet.',
            remediationSnippet: `Configure reverse proxy or gateway (NGINX/Cloudflare/Envoy) to strip the '${routingKey}' header on outbound responses.`,
            observationTimestamp: timestamp,
            snapshotId,
          });
        }
      }
    }

    return observations;
  }

  /**
   * Inspects response bodies, error messages, or raw response text for stack traces and SQL syntax disclosures.
   */
  public analyzeBodyOrError(
    content: string | undefined | null,
    snapshotId?: string,
    observationTimestamp?: string,
  ): NormalizedLeakageObservation[] {
    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      return [];
    }

    const observations: NormalizedLeakageObservation[] = [];
    const timestamp = observationTimestamp || new Date().toISOString();

    // 1. Stack Trace Detection
    for (const sig of this.STACK_TRACE_SIGNATURES) {
      const match = sig.regex.exec(content);
      if (match) {
        const matchSnippet = content.substring(
          Math.max(0, match.index - 50),
          Math.min(content.length, match.index + 250),
        );

        observations.push({
          id: `leak-stacktrace-${sig.runtime.toLowerCase()}`,
          type: 'STACK_TRACE',
          source: 'BODY',
          key: 'stack-trace-disclosure',
          rawEvidenceRedacted: this.redactSensitiveData(matchSnippet.trim()),
          details: `Authoritative response contains an unhandled ${sig.name}.`,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'CONFIRMED_SECURITY_CONDITION',
          severityRationale:
            'Stack traces reveal internal filesystem structures, library dependencies, exact framework versions, and code logic flaws.',
          whatThisDoesNotProve:
            'A stack trace disclosure does not prove that arbitrary code execution or data extraction has occurred.',
          remediationSnippet: `Configure a global exception handler in ${sig.runtime} to return generic error messages in production and log stack traces internally.`,
          observationTimestamp: timestamp,
          snapshotId,
        });
        break; // One stack trace observation per response is sufficient
      }
    }

    // 2. SQL Syntax / Error Disclosure
    for (const sqlSig of this.SQL_ERROR_SIGNATURES) {
      const match = sqlSig.regex.exec(content);
      if (match) {
        const matchSnippet = content.substring(
          Math.max(0, match.index - 30),
          Math.min(content.length, match.index + 200),
        );

        observations.push({
          id: `leak-sql-${sqlSig.database.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'SQL_ERROR_LEAK',
          source: 'BODY',
          key: 'sql-error-disclosure',
          rawEvidenceRedacted: this.redactSensitiveData(matchSnippet.trim()),
          details: `Authoritative response leaks ${sqlSig.name} details in response payload.`,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'CONFIRMED_SECURITY_CONDITION',
          severityRationale:
            'Leaking raw SQL errors exposes database schema names, column types, and query logic, facilitating SQL injection exploration.',
          whatThisDoesNotProve:
            'A raw database error message indicates unhandled query failures but does not prove the endpoint is exploitable for arbitrary data exfiltration.',
          remediationSnippet:
            'Catch database exceptions at the data access layer and prevent raw SQL diagnostic output in HTTP responses.',
          observationTimestamp: timestamp,
          snapshotId,
        });
        break; // One SQL error observation is sufficient
      }
    }

    return observations;
  }

  /**
   * Correlates full data leakage posture across headers and body snippets.
   */
  public assessDataLeakage(
    headers?: Record<string, any>,
    bodyOrErrorText?: string,
    snapshotId?: string,
  ): DataLeakageAssessment {
    const headerFindings = this.analyzeHeaders(headers, snapshotId);
    const bodyFindings = this.analyzeBodyOrError(bodyOrErrorText, snapshotId);
    const all = [...headerFindings, ...bodyFindings];

    const debugHeaderFindings = all.filter(
      (f) => f.type === 'DEBUG_HEADER' || f.type === 'DIAGNOSTIC_SOURCEMAP',
    );
    const internalTopologyFindings = all.filter(
      (f) => f.type === 'INTERNAL_IP_ROUTING',
    );
    const stackTraceFindings = all.filter(
      (f) => f.type === 'STACK_TRACE' || f.type === 'SQL_ERROR_LEAK',
    );

    const totalFindings = all.length;
    const isHardened = totalFindings === 0;

    let summary =
      'No diagnostic data leakage or stack trace disclosures detected in observable responses.';
    if (!isHardened) {
      summary = `${totalFindings} data leakage / debug exposure finding(s) detected across HTTP headers and response telemetry.`;
    }

    return {
      snapshotId,
      totalFindings,
      debugHeaderFindings,
      internalTopologyFindings,
      stackTraceFindings,
      isHardened,
      summary,
    };
  }
}
