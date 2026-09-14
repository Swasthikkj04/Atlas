import {
  TechnologyDetector,
  TechnologyCategory,
  TechnologyConfidenceLevel,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyEvidence,
  TechnologySignal,
  TechnologyMeaning,
} from '../contracts';

export interface CreateResultOptions {
  confidence: number;
  confidenceLevel?: TechnologyConfidenceLevel;
  evidence: TechnologyEvidence[];
  signals?: TechnologySignal[];
  whyDetected?: string;
  role?: string;
  infrastructureMeaning?: string;
  whatThisDoesNotProve?: string;
  implications?: string[];
  description?: string;
  version?: string;
  versionEvidence?: string;
}

export abstract class BaseTechnologyDetector implements TechnologyDetector {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly category: TechnologyCategory | string;
  abstract readonly description: string;
  abstract readonly role: string;
  abstract readonly infrastructureMeaning: string;
  abstract readonly detectionSignals: string[];
  abstract readonly confidenceRules: string;
  readonly whatThisDoesNotProve?: string;
  readonly defaultImplications?: string[];

  abstract detect(
    context: TechnologyDetectionContext,
  ):
    | TechnologyDetectionResult
    | null
    | Promise<TechnologyDetectionResult | null>;

  interpret(
    result: TechnologyDetectionResult,
    _context: TechnologyDetectionContext,
  ): TechnologyMeaning {
    return {
      whyDetected: result.whyDetected || this.buildWhyDetected(result),
      role: result.role || this.role,
      infrastructureMeaning:
        result.infrastructureMeaning || this.infrastructureMeaning,
      whatThisDoesNotProve:
        result.whatThisDoesNotProve ||
        this.whatThisDoesNotProve ||
        this.buildDefaultBoundary(result),
      implications:
        result.implications ||
        this.defaultImplications ||
        this.buildDefaultImplications(result),
    };
  }

  protected createResult(
    options: CreateResultOptions,
  ): TechnologyDetectionResult {
    const confidenceLevel: TechnologyConfidenceLevel =
      options.confidenceLevel ??
      (options.confidence >= 0.9
        ? 'HIGH'
        : options.confidence >= 0.7
          ? 'MEDIUM'
          : 'LOW');

    const rawResult: TechnologyDetectionResult = {
      id: this.id,
      name: this.name,
      category: this.category,
      description: options.description ?? this.description,
      status: 'DETECTED',
      confidence: options.confidence,
      confidenceLevel,
      whyDetected: options.whyDetected ?? '',
      role: options.role ?? this.role,
      infrastructureMeaning:
        options.infrastructureMeaning ?? this.infrastructureMeaning,
      whatThisDoesNotProve:
        options.whatThisDoesNotProve ?? this.whatThisDoesNotProve,
      implications: options.implications ?? this.defaultImplications,
      evidence: options.evidence,
      signals: options.signals ?? [],
      evidenceCount: options.evidence.length,
      version: options.version,
      versionEvidence: options.versionEvidence,
    };

    if (!rawResult.whyDetected) {
      (rawResult as any).whyDetected = this.buildWhyDetected(rawResult);
    }

    if (!rawResult.whatThisDoesNotProve && this.whatThisDoesNotProve) {
      (rawResult as any).whatThisDoesNotProve = this.whatThisDoesNotProve;
    }

    return rawResult;
  }

  protected buildWhyDetected(result: TechnologyDetectionResult): string {
    if (result.evidence && result.evidence.length > 0) {
      const indicators = result.evidence.map((e) => {
        if (e.observedValue && e.observedValue !== e.indicator) {
          return `${e.source} ('${e.observedValue}')`;
        }
        return `${e.source} (${e.indicator})`;
      });

      if (indicators.length === 1) {
        return `Observed ${indicators[0]}.`;
      }
      if (indicators.length === 2) {
        return `Observed ${indicators[0]} and ${indicators[1]}.`;
      }
      return `Observed correlated telemetry across ${indicators.slice(0, 3).join(', ')}.`;
    }

    if (result.signals && result.signals.length > 0) {
      const matchedSignals = result.signals
        .filter((s) => s.matched)
        .map((s) => s.indicator || s.name);
      if (matchedSignals.length > 0) {
        return `Identified matching signals: ${matchedSignals.join(', ')}.`;
      }
    }

    return `Identified characteristic signatures matching ${this.name}.`;
  }

  protected buildDefaultBoundary(result: TechnologyDetectionResult): string {
    return `Observed signals confirm the presence of ${result.name} in the endpoint communication path, but do not prove underlying physical server location or unobserved components.`;
  }

  protected buildDefaultImplications(
    result: TechnologyDetectionResult,
  ): string[] {
    return [
      `${result.name} actively participates in the public infrastructure path.`,
      `Configuration and telemetry are verifiable from public network observations.`,
    ];
  }
}
