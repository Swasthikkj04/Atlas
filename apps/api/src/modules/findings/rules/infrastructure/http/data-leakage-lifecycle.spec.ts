import { DebugHeaderExposureRule } from './debug-header-exposure.rule';
import { StackTraceDisclosureRule } from './stack-trace-disclosure.rule';
import { DataLeakageAnalyzerService } from '../../../services/data-leakage-analyzer.service';
import { FindingContext } from '../../../contracts/finding-context.interface';

describe('S2 Data Leakage Lifecycle & Historical Remediation (S2-005)', () => {
  let analyzer: DataLeakageAnalyzerService;
  let debugRule: DebugHeaderExposureRule;
  let stackTraceRule: StackTraceDisclosureRule;

  beforeEach(() => {
    analyzer = new DataLeakageAnalyzerService();
    debugRule = new DebugHeaderExposureRule(analyzer);
    stackTraceRule = new StackTraceDisclosureRule(analyzer);
  });

  it('demonstrates ACTIVE finding in vulnerable Snapshot N and RESOLVED in hardened Snapshot N+1', async () => {
    // Snapshot N: Leaks debug token and stack trace in 500 response
    const snapshotNContext: FindingContext = {
      domainId: 'domain-prod',
      snapshotId: 'snap-n-vulnerable',
      snapshot: {
        htmlBody: `TypeError: Cannot read properties of undefined
    at UserController.getProfile (/var/www/src/user.ts:15:20)`,
        http: {
          url: 'https://api.prod.com',
          reachable: true,
          queryStatus: 'SUCCESS',
          headers: {
            'x-debug-token': 'prof-998811',
            'x-backend-server': '10.0.4.12',
          },
          finalUrl: 'https://api.prod.com',
          finalResponse: {
            url: 'https://api.prod.com',
            status: 500,
            statusText: 'Internal Server Error',
            headers: {
              'x-debug-token': 'prof-998811',
              'x-backend-server': '10.0.4.12',
            },
          },
        } as any,
      },
    };

    const debugFindingsN = await debugRule.evaluate(snapshotNContext);
    const traceFindingsN = await stackTraceRule.evaluate(snapshotNContext);

    expect(debugFindingsN).toHaveLength(1);
    expect(traceFindingsN).toHaveLength(1);

    // Snapshot N+1: Debug mode disabled, error boundary active, headers stripped
    const snapshotNPlus1Context: FindingContext = {
      domainId: 'domain-prod',
      snapshotId: 'snap-n-plus-1-hardened',
      snapshot: {
        htmlBody:
          '{"error": "Internal Server Error", "requestId": "req-12345"}',
        http: {
          url: 'https://api.prod.com',
          reachable: true,
          queryStatus: 'SUCCESS',
          headers: {
            server: 'nginx',
            'content-type': 'application/json',
          },
          finalUrl: 'https://api.prod.com',
          finalResponse: {
            url: 'https://api.prod.com',
            status: 500,
            statusText: 'Internal Server Error',
            headers: {
              server: 'nginx',
              'content-type': 'application/json',
            },
          },
        } as any,
      },
    };

    const debugFindingsNPlus1 = await debugRule.evaluate(snapshotNPlus1Context);
    const traceFindingsNPlus1 = await stackTraceRule.evaluate(
      snapshotNPlus1Context,
    );

    expect(debugFindingsNPlus1).toHaveLength(0);
    expect(traceFindingsNPlus1).toHaveLength(0);
  });
});
