import { DataLeakageAnalyzerService } from './data-leakage-analyzer.service';
import { Severity } from '../enums/severity.enum';

describe('DataLeakageAnalyzerService (S2-001)', () => {
  let service: DataLeakageAnalyzerService;

  beforeEach(() => {
    service = new DataLeakageAnalyzerService();
  });

  describe('Sensitive Data Redaction (S2-001 / S2-007)', () => {
    it('redacts database connection credentials', () => {
      const input =
        'Error connecting to postgres://admin:supersecret123@db.internal:5432/production_app';
      const redacted = service.redactSensitiveData(input);
      expect(redacted).not.toContain('supersecret123');
      expect(redacted).toContain(
        'postgres://[REDACTED]:[REDACTED]@db.internal:5432/production_app',
      );
    });

    it('redacts Bearer authorization tokens', () => {
      const input =
        'Request failed with header Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
      const redacted = service.redactSensitiveData(input);
      expect(redacted).not.toContain('eyJhbGci');
      expect(redacted).toContain('Bearer [REDACTED]');
    });

    it('redacts API key and password parameters', () => {
      const input =
        'Failed query: api_key=ak_live_8917238912389123&password=my_secret_pass';
      const redacted = service.redactSensitiveData(input);
      expect(redacted).not.toContain('ak_live_8917238912389123');
      expect(redacted).not.toContain('my_secret_pass');
      expect(redacted).toContain('api_key=[REDACTED]');
    });
  });

  describe('Header Analysis & RFC 1918 Private IP Routing (S2-001 / S2-002)', () => {
    it('detects Symfony X-Debug-Token profiling headers', () => {
      const headers = {
        'x-debug-token': 'a1b2c3d4',
        'x-debug-token-link': 'https://example.com/_profiler/a1b2c3d4',
      };
      const findings = service.analyzeHeaders(headers, 'snap-1');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('DEBUG_HEADER');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].confidence).toBe('AUTHORITATIVE');
      expect(findings[0].key).toBe('x-debug-token');
    });

    it('detects PHP Clockwork diagnostic headers', () => {
      const headers = {
        'x-clockwork-id': '1589302194.2091',
        'x-clockwork-version': '5.1',
      };
      const findings = service.analyzeHeaders(headers, 'snap-1');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('DEBUG_HEADER');
      expect(findings[0].severity).toBe(Severity.HIGH);
    });

    it('detects RFC 1918 private IP disclosure in X-Backend-Server header (10.x.x.x)', () => {
      const headers = {
        'x-backend-server': '10.240.0.14:8080',
        server: 'nginx',
      };
      const findings = service.analyzeHeaders(headers, 'snap-1');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('INTERNAL_IP_ROUTING');
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].rawEvidenceRedacted).toContain('10.240.0.14:8080');
    });

    it('detects internal VPC hostnames in X-Served-By header', () => {
      const headers = {
        'x-served-by': 'node-4.us-east.internal',
      };
      const findings = service.analyzeHeaders(headers, 'snap-1');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('INTERNAL_IP_ROUTING');
      expect(findings[0].rawEvidenceRedacted).toContain(
        'node-4.us-east.internal',
      );
    });

    it('returns empty findings for clean production headers', () => {
      const headers = {
        server: 'cloudflare',
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=3600',
      };
      const findings = service.analyzeHeaders(headers, 'snap-1');
      expect(findings).toHaveLength(0);
    });
  });

  describe('Stack Trace & Database Error Analysis (S2-001 / S2-003)', () => {
    it('detects Node.js / Express stack trace error body', () => {
      const body = `TypeError: Cannot read properties of undefined (reading 'userId')
    at Object.<anonymous> (/var/www/app/src/controllers/user.controller.ts:42:15)
    at Module._compile (node:internal/modules/cjs/loader:1376:14)`;
      const findings = service.analyzeBodyOrError(body, 'snap-1');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('STACK_TRACE');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].details).toContain('Node.js');
    });

    it('detects Python / Django traceback disclosure', () => {
      const body = `Traceback (most recent call last):
  File "/app/web/views/auth.py", line 128, in authenticate
    user = User.objects.get(email=email)
django.core.exceptions.ObjectDoesNotExist: User matching query does not exist.`;
      const findings = service.analyzeBodyOrError(body, 'snap-1');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('STACK_TRACE');
      expect(findings[0].details).toContain('Python');
    });

    it('detects PostgreSQL SQL syntax error leaks', () => {
      const body = `{"error": "PG::Error: ERROR: syntax error at or near \\"SELECT * FROM users WHERE id = \\" at character 1"}`;
      const findings = service.analyzeBodyOrError(body, 'snap-1');
      expect(findings).toHaveLength(1);
      expect(findings[0].type).toBe('SQL_ERROR_LEAK');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].details).toContain('PostgreSQL');
    });

    it('returns empty findings for normal JSON error responses without stack traces', () => {
      const body = '{"status": 404, "message": "Resource not found"}';
      const findings = service.analyzeBodyOrError(body, 'snap-1');
      expect(findings).toHaveLength(0);
    });
  });

  describe('assessDataLeakage Correlation', () => {
    it('correlates headers and body findings into a unified assessment', () => {
      const headers = { 'x-backend-server': '192.168.1.100' };
      const body =
        'Fatal error: Uncaught Exception: DB dead in /var/www/index.php:12\nStack trace:\n#0 /var/www/index.php';

      const assessment = service.assessDataLeakage(headers, body, 'snap-1');
      expect(assessment.totalFindings).toBe(2);
      expect(assessment.isHardened).toBe(false);
      expect(assessment.internalTopologyFindings).toHaveLength(1);
      expect(assessment.stackTraceFindings).toHaveLength(1);
      expect(assessment.summary).toContain(
        '2 data leakage / debug exposure finding(s) detected',
      );
    });
  });
});
