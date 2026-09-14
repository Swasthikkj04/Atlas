import { Test, TestingModule } from '@nestjs/testing';
import { FindingsModule } from '../../../findings.module';
import { FindingRuleEngineService } from '../../../services/finding-rule-engine.service';
import { FindingContext } from '../../../contracts/finding-context.interface';

describe('Perimeter & Configuration Exposure Lifecycle & Engine Verification (S7)', () => {
  let engine: FindingRuleEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FindingsModule],
    }).compile();

    engine = module.get<FindingRuleEngineService>(FindingRuleEngineService);
  });

  it('runs complete lifecycle evaluation detecting exposed .git, .env, and management endpoints', async () => {
    const context: FindingContext = {
      domainName: 'leaky-perimeter.corp',
      snapshot: {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          url: 'https://leaky-perimeter.corp/.git/HEAD',
          statusCode: 200,
          body: 'ref: refs/heads/release\nDB_PASSWORD=secret123\n# HELP jvm_threads_current Current threads\n',
        },
      } as any,
    };

    const results = await engine.evaluate(context);
    const ruleIds = results.map((r) => r.ruleId);

    expect(ruleIds).toContain('security.git-repository-exposure');
    expect(ruleIds).toContain('security.env-file-exposure');
    expect(ruleIds).toContain('security.management-endpoint-exposure');
  });
});
