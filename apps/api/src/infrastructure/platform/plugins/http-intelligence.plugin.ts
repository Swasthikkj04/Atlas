import { Injectable } from '@nestjs/common';
import { FindingCategory } from '../../../modules/findings/enums/finding-category.enum';
import { Severity } from '../../../modules/findings/enums/severity.enum';
import { AtlasIntelligencePlugin, IntelligenceRuleEvaluationResult } from '../contracts/intelligence-plugin.interface';
import { PluginLifecycleState, PluginManifest } from '../contracts/plugin-manifest.interface';

@Injectable()
export class HttpIntelligencePlugin implements AtlasIntelligencePlugin {
  readonly manifest: PluginManifest = {
    id: 'http-intelligence',
    name: 'HTTP Intelligence Rule Pack Plugin',
    version: '1.0.0',
    engine: 'intelligence',
    apiVersion: 1,
    capabilities: ['hsts-check', 'csp-check', 'xframe-check', 'xcontent-type-check'],
  };

  state: PluginLifecycleState = 'REGISTERED';

  async initialize(): Promise<void> {
    this.state = 'INITIALIZED';
  }

  evaluate(canonicalObservations: Record<string, any>): IntelligenceRuleEvaluationResult[] {
    this.state = 'EXECUTING';
    const results: IntelligenceRuleEvaluationResult[] = [];

    const hsts = canonicalObservations.strictTransportSecurity;
    if (hsts && hsts.observation.state === 'MISSING') {
      results.push({
        ruleId: 'http.missing-hsts',
        matched: true,
        evidenceReferences: [hsts.lineage.evidenceId],
        finding: {
          ruleId: 'http.missing-hsts',
          module: 'HTTP' as any,
          title: 'Missing HSTS Header',
          description: 'The application does not send the Strict-Transport-Security header.',
          category: FindingCategory.SECURITY_HEADER,
          severity: Severity.HIGH,
          recommendations: [
            {
              title: 'Enable HSTS',
              description: 'Configure Strict-Transport-Security header with max-age=31536000.',
            },
          ],
        },
      });
    }

    this.state = 'INITIALIZED';
    return results;
  }

  async shutdown(): Promise<void> {
    this.state = 'SHUTDOWN';
  }
}
