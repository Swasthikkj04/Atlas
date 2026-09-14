import { Injectable } from '@nestjs/common';
import { BaseTechnologyDetector } from '../../base/base-technology.detector';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyEvidence,
  TechnologySignal,
} from '../../contracts';

@Injectable()
export class GitHubPagesDetector extends BaseTechnologyDetector {
  readonly id = 'tech-github-pages';
  readonly name = 'GitHub Pages';
  readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
  readonly description =
    'GitHub Pages static website hosting and continuous deployment infrastructure';
  readonly role = 'Static Web Hosting';
  readonly infrastructureMeaning =
    'The public endpoint is served by GitHub Pages static infrastructure.';
  readonly detectionSignals = [
    'Server: github-pages response header',
    'x-github-pages-state response header',
    'x-github-request-id response header',
    'github.io in CNAME records',
  ];
  readonly confidenceRules =
    'HIGH confidence when Server: github-pages header, x-github-pages-state header, or github.io CNAME is observed.';

  detect(
    context: TechnologyDetectionContext,
  ): TechnologyDetectionResult | null {
    const evidence: TechnologyEvidence[] = [];
    const signals: TechnologySignal[] = [];

    const server = context.getHeader('server')?.toLowerCase() ?? '';
    const hasGhPagesState = context.hasHeader('x-github-pages-state');
    const hasGhRequestId = context.hasHeader('x-github-request-id');
    const hasGhCname = context.hasCname(/github\.io/i);

    if (server.includes('github-pages')) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: server',
        indicator: 'Server: github-pages',
        observedValue: context.getHeader('server'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GitHub Pages Server Header',
        type: 'HEADER',
        indicator: 'server: github-pages',
        matched: true,
        weight: 10,
      });
    }

    if (hasGhPagesState) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-github-pages-state',
        indicator: 'GitHub Pages build state header',
        observedValue: context.getHeader('x-github-pages-state'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GitHub Pages State Header',
        type: 'HEADER',
        indicator: 'x-github-pages-state',
        matched: true,
        weight: 10,
      });
    }

    if (hasGhRequestId) {
      evidence.push({
        sourceType: 'HTTP',
        source: 'Response Header: x-github-request-id',
        indicator: 'GitHub infrastructure request trace header',
        observedValue: context.getHeader('x-github-request-id'),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GitHub Request ID',
        type: 'HEADER',
        indicator: 'x-github-request-id',
        matched: true,
        weight: 8,
      });
    }

    if (hasGhCname) {
      evidence.push({
        sourceType: 'DNS',
        source: 'CNAME Records',
        indicator: 'GitHub Pages CNAME target (github.io)',
        observedValue: context.dns?.cname
          ?.filter((c) => /github\.io/i.test(c))
          .join(', '),
        confidence: 'HIGH',
      });
      signals.push({
        name: 'GitHub Pages CNAME',
        type: 'DNS',
        indicator: 'github.io CNAME',
        matched: true,
        weight: 9,
      });
    }

    if (evidence.length === 0) {
      return null;
    }

    return this.createResult({
      confidence: 0.99,
      confidenceLevel: 'HIGH',
      evidence,
      signals,
      role: `Static web hosting infrastructure for ${context.domainName}`,
      infrastructureMeaning: this.infrastructureMeaning,
    });
  }
}
