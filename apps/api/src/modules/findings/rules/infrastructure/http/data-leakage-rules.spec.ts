import { DebugHeaderExposureRule } from './debug-header-exposure.rule';
import { InternalTopologyLeakageRule } from './internal-topology-leakage.rule';
import { StackTraceDisclosureRule } from './stack-trace-disclosure.rule';
import { DataLeakageAnalyzerService } from '../../../services/data-leakage-analyzer.service';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { Severity } from '../../../enums/severity.enum';

describe('S2 Data Leakage & Debug Exposure Rules (S2-002, S2-003, S2-004)', () => {
  let dataLeakageAnalyzer: DataLeakageAnalyzerService;
  let debugHeaderRule: DebugHeaderExposureRule;
  let internalTopologyRule: InternalTopologyLeakageRule;
  let stackTraceRule: StackTraceDisclosureRule;

  beforeEach(() => {
    dataLeakageAnalyzer = new DataLeakageAnalyzerService();
    debugHeaderRule = new DebugHeaderExposureRule(dataLeakageAnalyzer);
    internalTopologyRule = new InternalTopologyLeakageRule(dataLeakageAnalyzer);
    stackTraceRule = new StackTraceDisclosureRule(dataLeakageAnalyzer);
  });

  const createMockContext = (
    headers: Record<string, any> = {},
    htmlBody?: string,
    url: string = 'https://app.example.com',
  ): FindingContext => ({
    domainId: 'domain-1',
    snapshotId: 'snapshot-1',
    snapshot: {
      htmlBody,
      http: {
        url,
        reachable: true,
        queryStatus: 'SUCCESS',
        headers,
        finalUrl: url,
        finalResponse: {
          url,
          status: 200,
          statusText: 'OK',
          headers,
        },
      } as any,
    },
  });

  describe('DebugHeaderExposureRule (http.debug-header-exposed)', () => {
    it('creates HIGH severity finding for Symfony X-Debug-Token profiling headers', async () => {
      const context = createMockContext({
        'x-debug-token': '9a8b7c6d',
      });

      const findings = await debugHeaderRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.debug-header-exposed');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].confidence).toBe('AUTHORITATIVE');
      expect(findings[0].riskClassification).toBe(
        'CONFIRMED_SECURITY_CONDITION',
      );
      expect(findings[0].recommendations[0].description).toContain(
        'x-debug-token',
      );
    });

    it('returns empty findings when no debug headers are present', async () => {
      const context = createMockContext({
        'content-type': 'application/json',
        server: 'nginx/1.24.0',
      });

      const findings = await debugHeaderRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('InternalTopologyLeakageRule (http.internal-topology-leakage)', () => {
    it('creates MEDIUM severity finding for RFC 1918 internal IP in X-Backend-Server header', async () => {
      const context = createMockContext({
        'x-backend-server': '10.0.12.5:3000',
      });

      const findings = await internalTopologyRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.internal-topology-leakage');
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].description).toContain('x-backend-server');
      expect(findings[0].recommendations[0].description).toContain(
        '10.0.12.5:3000',
      );
    });

    it('returns empty findings for public gateway addresses in headers', async () => {
      const context = createMockContext({
        'cf-ray': '8129381293812-IAD',
        server: 'cloudflare',
      });

      const findings = await internalTopologyRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('StackTraceDisclosureRule (http.stack-trace-disclosure)', () => {
    it('creates HIGH severity finding when unhandled stack trace is present in response body', async () => {
      const errorBody = `TypeError: Cannot read properties of null (reading 'roles')
    at AuthenticateMiddleware.handle (/var/www/src/middleware/auth.ts:25:18)
    at Layer.handle [as handle_request] (/var/www/node_modules/express/lib/router/layer.js:95:5)`;

      const context = createMockContext({}, errorBody);

      const findings = await stackTraceRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.stack-trace-disclosure');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain('Unhandled Application Stack Trace');
    });

    it('creates HIGH severity finding when raw SQL syntax error is leaked', async () => {
      const sqlError = `{"error": "syntax error at or near \\"FROM users\\"", "code": "SQLSTATE[42601]"}`;
      const context = createMockContext({}, sqlError);

      const findings = await stackTraceRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].title).toContain('Database Query Error Disclosed');
      expect(findings[0].severity).toBe(Severity.HIGH);
    });

    it('returns empty findings when response body contains normal sanitized JSON', async () => {
      const normalBody = '{"success": true, "data": []}';
      const context = createMockContext({}, normalBody);

      const findings = await stackTraceRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('Anti-Overreach Guarantees (S2-004)', () => {
    it('verifies bounded whatThisDoesNotProve qualifiers across all S2 rules', async () => {
      const debugContext = createMockContext({ 'x-debug-token': 'token-123' });
      const topoContext = createMockContext({
        'x-backend-server': '192.168.1.5',
      });
      const traceContext = createMockContext(
        {},
        'Traceback (most recent call last):\nFile "app.py", line 10',
      );

      const debugFindings = await debugHeaderRule.evaluate(debugContext);
      const topoFindings = await internalTopologyRule.evaluate(topoContext);
      const traceFindings = await stackTraceRule.evaluate(traceContext);

      expect(debugFindings[0].whatThisDoesNotProve).toContain('does not prove');
      expect(topoFindings[0].whatThisDoesNotProve).toContain(
        'does not prove that the internal host is reachable directly',
      );
      expect(traceFindings[0].whatThisDoesNotProve).toContain(
        'does not prove that arbitrary code execution or data extraction has occurred',
      );
    });
  });
});
