import { MetricsService } from './metrics.service';

describe('MetricsService & PrometheusRegistry', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
  });

  describe('1. Prometheus Exposition Format Rendering', () => {
    it('should generate valid Prometheus text format', () => {
      metricsService.recordHttpRequest('GET', '/api/v1/explorer', 200, 0.007);
      metricsService.recordFinding('HIGH', 'SECURITY_HEADER', 'OPEN');
      metricsService.recordDiscoveryJob('COMPLETED', 1.2);

      const text = metricsService.getMetricsText();

      expect(text).toContain('# HELP atlas_http_requests_total');
      expect(text).toContain('# TYPE atlas_http_requests_total counter');
      expect(text).toContain('atlas_http_requests_total{method="GET",route="/api/v1/explorer",status="200"} 1');
      expect(text).toContain('atlas_findings_total{severity="HIGH",category="SECURITY_HEADER",state="OPEN"} 1');
      expect(text).toContain('atlas_discovery_jobs_total{status="COMPLETED"} 1');
      expect(text).toContain('atlas_process_heap_bytes');
    });

    it('should track active HTTP requests in flight', () => {
      metricsService.incActiveRequests();
      let text = metricsService.getMetricsText();
      expect(text).toContain('atlas_http_active_requests 1');

      metricsService.decActiveRequests();
      text = metricsService.getMetricsText();
      expect(text).toContain('atlas_http_active_requests 0');
    });

    it('should sanitize dynamic UUIDs in route labels to prevent high cardinality', () => {
      metricsService.recordHttpRequest(
        'GET',
        '/api/v1/timeline/3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1/details',
        200,
        0.009,
      );

      const text = metricsService.getMetricsText();

      expect(text).toContain('route="/api/v1/timeline/:id/details"');
      expect(text).not.toContain('3d91d72d-5f86-4e4c-b9ef-65e4e6b1b5b1');
    });
  });
});
