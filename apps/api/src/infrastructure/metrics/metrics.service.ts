import { Injectable } from '@nestjs/common';
import { LabelMap, PrometheusRegistry } from './prometheus.registry';

@Injectable()
export class MetricsService {
  private readonly registry = new PrometheusRegistry();
  private activeRequests = 0;

  constructor() {
    this.initMetrics();
  }

  private initMetrics() {
    this.registry.setGauge(
      'atlas_http_active_requests',
      'Current number of active HTTP requests in flight.',
      {},
      0,
    );
    this.registry.setGauge(
      'atlas_worker_active_workers',
      'Number of active background worker threads.',
      {},
      1,
    );
    this.registry.setGauge(
      'atlas_db_connection_status',
      'Database connection status (1 = UP, 0 = DOWN).',
      {},
      1,
    );
  }

  // 1. HTTP Metrics
  recordHttpRequest(
    method: string,
    route: string,
    status: number,
    durationSec: number,
  ): void {
    const labels: LabelMap = {
      method,
      route: this.sanitizeRoute(route),
      status: String(status),
    };

    this.registry.incCounter(
      'atlas_http_requests_total',
      'Total number of HTTP requests processed by Atlas API.',
      labels,
    );

    this.registry.observeHistogram(
      'atlas_http_request_duration_seconds',
      'HTTP request latency duration in seconds.',
      labels,
      durationSec,
    );

    if (status >= 400) {
      this.registry.incCounter(
        'atlas_http_errors_total',
        'Total number of HTTP client/server error responses.',
        labels,
      );
    }
  }

  incActiveRequests(): void {
    this.activeRequests += 1;
    this.registry.setGauge(
      'atlas_http_active_requests',
      'Current number of active HTTP requests in flight.',
      {},
      this.activeRequests,
    );
  }

  decActiveRequests(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.registry.setGauge(
      'atlas_http_active_requests',
      'Current number of active HTTP requests in flight.',
      {},
      this.activeRequests,
    );
  }

  // 2. Discovery Metrics
  recordDiscoveryJob(status: 'COMPLETED' | 'FAILED' | 'STARTED', durationSec?: number): void {
    this.registry.incCounter(
      'atlas_discovery_jobs_total',
      'Total number of infrastructure discovery understanding jobs.',
      { status },
    );
    if (durationSec !== undefined) {
      this.registry.observeHistogram(
        'atlas_discovery_duration_seconds',
        'Discovery job execution duration in seconds.',
        { status },
        durationSec,
      );
    }
  }

  // 3. Knowledge Engine Metrics
  recordKnowledgeAsset(category: string): void {
    this.registry.incCounter(
      'atlas_knowledge_assets_generated_total',
      'Total number of normalized infrastructure assets generated.',
      { category },
    );
  }

  recordKnowledgeRelationship(type: string): void {
    this.registry.incCounter(
      'atlas_knowledge_relationships_generated_total',
      'Total number of Knowledge Graph relationships generated.',
      { type },
    );
  }

  // 4. Findings Metrics
  recordFinding(severity: string, category: string, state = 'OPEN'): void {
    this.registry.incCounter(
      'atlas_findings_total',
      'Total number of security & infrastructure findings generated.',
      { severity, category, state },
    );
  }

  // 5. Timeline Metrics
  recordTimelineEvent(changeType: string, category: string): void {
    this.registry.incCounter(
      'atlas_timeline_events_total',
      'Total number of infrastructure timeline change events generated.',
      { change_type: changeType, category },
    );
  }

  // 6. Explorer Metrics
  recordExplorerRequest(type: string, durationSec: number): void {
    this.registry.incCounter(
      'atlas_explorer_requests_total',
      'Total number of Infrastructure Explorer workspace requests.',
      { type },
    );
    this.registry.observeHistogram(
      'atlas_explorer_response_duration_seconds',
      'Explorer response latency duration in seconds.',
      { type },
      durationSec,
    );
  }

  // 7. Auth Metrics
  recordAuthRequest(type: 'LOGIN' | 'REGISTER', status: 'SUCCESS' | 'FAILURE'): void {
    this.registry.incCounter(
      'atlas_auth_requests_total',
      'Total number of authentication requests.',
      { type, status },
    );
  }

  // 8. Database Metrics
  recordDbQuery(operation: string, durationSec: number): void {
    this.registry.incCounter(
      'atlas_db_queries_total',
      'Total number of PostgreSQL database queries executed.',
      { operation },
    );
    this.registry.observeHistogram(
      'atlas_db_query_duration_seconds',
      'Database query latency duration in seconds.',
      { operation },
      durationSec,
    );
  }

  recordDbSlowQuery(model: string, action: string): void {
    this.registry.incCounter(
      'atlas_db_slow_queries_total',
      'Total number of slow database queries exceeding threshold.',
      { model: model || 'raw', action: action || 'query' },
    );
  }

  // 9. Security Metrics
  recordSecurityEvent(type: 'AUTH_FAILURE' | 'INVALID_JWT' | 'FORBIDDEN' | 'ABUSE_DETECTED'): void {
    this.registry.incCounter(
      'atlas_security_events_total',
      'Total number of security events and potential attack attempts.',
      { type },
    );

    if (type === 'AUTH_FAILURE') {
      this.registry.incCounter(
        'atlas_auth_failures_total',
        'Total number of failed authentication attempts.',
        {},
      );
    } else if (type === 'INVALID_JWT') {
      this.registry.incCounter(
        'atlas_invalid_jwt_total',
        'Total number of malformed or invalid JWT access tokens received.',
        {},
      );
    } else if (type === 'FORBIDDEN') {
      this.registry.incCounter(
        'atlas_authorization_failures_total',
        'Total number of unauthorized / cross-tenant access attempts.',
        {},
      );
    }
  }

  // 9. Process Metrics
  private updateProcessMetrics(): void {
    const mem = process.memoryUsage();
    this.registry.setGauge(
      'atlas_process_heap_bytes',
      'Process heap memory used in bytes.',
      { type: 'used' },
      mem.heapUsed,
    );
    this.registry.setGauge(
      'atlas_process_heap_bytes',
      'Process heap memory total in bytes.',
      { type: 'total' },
      mem.heapTotal,
    );
    this.registry.setGauge(
      'atlas_process_rss_bytes',
      'Resident set size memory in bytes.',
      {},
      mem.rss,
    );
    this.registry.setGauge(
      'atlas_process_uptime_seconds',
      'Process uptime in seconds.',
      {},
      Math.floor(process.uptime()),
    );
  }

  getMetricsText(): string {
    this.updateProcessMetrics();
    return this.registry.toPrometheusFormat();
  }

  private sanitizeRoute(route: string): string {
    if (!route) return 'unknown';
    return route
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/evt-[^/]+/gi, '/:id')
      .replace(/\/find-[^/]+/gi, '/:id')
      .replace(/\/ast-[^/]+/gi, '/:id')
      .replace(/\/snap-[^/]+/gi, '/:id');
  }
}
