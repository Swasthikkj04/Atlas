import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  BehavioralSignal,
  BehavioralFingerprintResult,
} from '../contracts';
import { HttpBehaviorAnalyzer } from '../behavioral/http-behavior.analyzer';
import { CookieBehaviorAnalyzer } from '../behavioral/cookie-behavior.analyzer';
import { ErrorBehaviorAnalyzer } from '../behavioral/error-behavior.analyzer';
import { TlsBehaviorAnalyzer } from '../behavioral/tls-behavior.analyzer';
import { EvidenceFusionEngine } from '../behavioral/evidence-fusion.engine';

/**
 * T22 — Deep Wire & Behavioral Fingerprinting Engine
 *
 * Move Nebula beyond explicit technology banners by corroborating infrastructure
 * understanding from multiple independent observable signals:
 * - T22-A: HTTP response behavior (header ordering, casing, Keep-Alive socket parameters, range behavior)
 * - T22-B: Cookie structural signals (session tokens, prefixes, security attributes)
 * - T22-C: Error response fingerprints (404/502/403 structural templates, router signatures)
 * - T22-D: TLS behavioral evidence (certificate authority, issuer profiling, protocol negotiation)
 * - T22-E: Evidence fusion (combining direct observations with behavioral signals into honest postures)
 */
@Injectable()
export class DeepBehavioralFingerprintingEngine {
  private readonly logger = new Logger(DeepBehavioralFingerprintingEngine.name);

  private readonly httpAnalyzer: HttpBehaviorAnalyzer;
  private readonly cookieAnalyzer: CookieBehaviorAnalyzer;
  private readonly errorAnalyzer: ErrorBehaviorAnalyzer;
  private readonly tlsAnalyzer: TlsBehaviorAnalyzer;
  private readonly fusionEngine: EvidenceFusionEngine;

  constructor(
    @Optional() httpAnalyzer?: HttpBehaviorAnalyzer,
    @Optional() cookieAnalyzer?: CookieBehaviorAnalyzer,
    @Optional() errorAnalyzer?: ErrorBehaviorAnalyzer,
    @Optional() tlsAnalyzer?: TlsBehaviorAnalyzer,
    @Optional() fusionEngine?: EvidenceFusionEngine,
  ) {
    this.httpAnalyzer = httpAnalyzer ?? new HttpBehaviorAnalyzer();
    this.cookieAnalyzer = cookieAnalyzer ?? new CookieBehaviorAnalyzer();
    this.errorAnalyzer = errorAnalyzer ?? new ErrorBehaviorAnalyzer();
    this.tlsAnalyzer = tlsAnalyzer ?? new TlsBehaviorAnalyzer();
    this.fusionEngine = fusionEngine ?? new EvidenceFusionEngine();
  }

  /**
   * Analyze the detection context for deep behavioral signatures across all 5 evidence families
   * and fuse them with existing detector results.
   */
  analyze(
    context: TechnologyDetectionContext,
    existingResults: TechnologyDetectionResult[],
  ): {
    results: TechnologyDetectionResult[];
    behavioralResult: BehavioralFingerprintResult;
  } {
    // 1. Extract signals across all 4 behavioral domains
    const httpSignals = this.httpAnalyzer.analyze(context);
    const cookieSignals = this.cookieAnalyzer.analyze(context);
    const errorSignals = this.errorAnalyzer.analyze(context);
    const tlsSignals = this.tlsAnalyzer.analyze(context);

    const allSignals: BehavioralSignal[] = [
      ...httpSignals,
      ...cookieSignals,
      ...errorSignals,
      ...tlsSignals,
    ];

    const totalEvaluatedSignatures = 34; // Comprehensive signature suite across all 4 analyzers (HTTP, Cookie, Error, TLS)

    // 2. Fuse independent behavioral signals with direct detector observations (T22-E)
    const { results: fusedResults, posturesByTechnology } =
      this.fusionEngine.fuse(existingResults, allSignals);

    this.logger.debug(
      `Deep behavioral fingerprinting evaluated ${totalEvaluatedSignatures} signatures for ${context.domainName}: matched ${allSignals.length} wire signals`,
    );

    return {
      results: fusedResults,
      behavioralResult: {
        signals: allSignals,
        evaluatedSignaturesCount: totalEvaluatedSignatures,
        matchedSignaturesCount: allSignals.length,
        posturesByTechnology,
      },
    };
  }
}
