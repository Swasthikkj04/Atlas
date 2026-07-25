import { RuleRegistry } from '../registries/rule.registry';
import { HttpMissingCspRule } from '../rules/http-missing-csp.rule';
import { HttpMissingHstsRule } from '../rules/http-missing-hsts.rule';
import { IntelligenceEngineService } from './intelligence-engine.service';

describe('IntelligenceEngineService (Rule Engine Refactor)', () => {
  let service: IntelligenceEngineService;
  let registry: RuleRegistry;

  beforeEach(() => {
    registry = new RuleRegistry();
    registry.register(new HttpMissingHstsRule());
    registry.register(new HttpMissingCspRule());

    service = new IntelligenceEngineService(registry);
  });

  it('should generate HIGH severity finding with lineage when header observation state is MISSING', () => {
    const normalizationResult: any = {
      domainId: 'domain-1',
      evidenceId: 'ev-v7-123',
      observations: {
        strictTransportSecurity: {
          lineage: { evidenceId: 'ev-v7-123' },
          observation: { state: 'MISSING' },
        },
      },
    };

    const pkg = service.evaluateKnowledge(normalizationResult);

    expect(pkg.findings).toHaveLength(1);
    expect(pkg.findings[0].ruleId).toBe('http.missing-hsts');
    expect(pkg.findings[0].severity).toBe('HIGH');
    expect(pkg.findings[0].lineage.evidenceIds).toContain('ev-v7-123');
    expect(pkg.findings[0].lineage.matchedObservations).toContain('strictTransportSecurity');
  });

  it('should produce 0 findings when security headers are OBSERVED', () => {
    const normalizationResult: any = {
      domainId: 'domain-1',
      evidenceId: 'ev-v7-123',
      observations: {
        strictTransportSecurity: {
          lineage: { evidenceId: 'ev-v7-123' },
          observation: { state: 'OBSERVED', value: 'max-age=31536000' },
        },
        contentSecurityPolicy: {
          lineage: { evidenceId: 'ev-v7-123' },
          observation: { state: 'OBSERVED', value: "default-src 'self'" },
        },
      },
    };

    const pkg = service.evaluateKnowledge(normalizationResult);

    expect(pkg.findings).toHaveLength(0);
    expect(pkg.diagnostics.matchedFindings).toBe(0);
  });

  it('should propagate UNKNOWN observation state without asserting FALSE or FAIL', () => {
    const normalizationResult: any = {
      domainId: 'domain-1',
      evidenceId: 'ev-v7-123',
      observations: {
        strictTransportSecurity: {
          lineage: { evidenceId: 'ev-v7-123' },
          observation: { state: 'UNKNOWN' },
        },
      },
    };

    const pkg = service.evaluateKnowledge(normalizationResult);

    expect(pkg.findings).toHaveLength(1);
    expect(pkg.findings[0].state).toBe('UNKNOWN');
    expect(pkg.diagnostics.unknownStates).toBe(1);
  });

  it('should evaluate deterministically and idempotently', () => {
    const normalizationResult: any = {
      domainId: 'domain-1',
      evidenceId: 'ev-v7-123',
      observations: {
        strictTransportSecurity: {
          lineage: { evidenceId: 'ev-v7-123' },
          observation: { state: 'MISSING' },
        },
      },
    };

    const run1 = service.evaluateKnowledge(normalizationResult);
    const run2 = service.evaluateKnowledge(normalizationResult);

    expect(run1.findings[0].findingId).toBe(run2.findings[0].findingId);
    expect(run1.findings[0].ruleId).toBe(run2.findings[0].ruleId);
  });
});
