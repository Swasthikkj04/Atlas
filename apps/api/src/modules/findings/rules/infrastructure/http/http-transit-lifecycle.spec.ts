import { Test, TestingModule } from '@nestjs/testing';
import { FindingsModule } from '../../../findings.module';
import { FindingRuleEngineService } from '../../../services/finding-rule-engine.service';
import { FindingContext } from '../../../contracts/finding-context.interface';

describe('HTTP Transit Security Lifecycle & Engine Verification (S6)', () => {
  let engine: FindingRuleEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FindingsModule],
    }).compile();

    engine = module.get<FindingRuleEngineService>(FindingRuleEngineService);
  });

  it('runs complete lifecycle evaluation detecting CORS, dangerous methods, and cleartext deficiencies in single snapshot', async () => {
    const context: FindingContext = {
      domainName: 'insecure-transit.corp',
      snapshot: {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          protocol: 'http',
          statusCode: 200,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true',
            allow: 'GET, POST, TRACE, OPTIONS',
          },
          redirectHops: [
            {
              url: 'http://insecure-transit.corp',
              scheme: 'http',
              statusCode: 200,
              headers: {},
            },
          ],
        },
      } as any,
    };

    const results = await engine.evaluate(context);
    const ruleIds = results.map((r) => r.ruleId);

    expect(ruleIds).toContain('http.insecure-cors-policy');
    expect(ruleIds).toContain('http.dangerous-methods-exposed');
    expect(ruleIds).toContain('http.cleartext-upgrade-missing');
  });
});
