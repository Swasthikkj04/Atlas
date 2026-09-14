import { Injectable, Logger } from '@nestjs/common';
import { TechnologyDetectorRegistryService } from '../registry/technology-detector-registry.service';
import {
  TechnologyDetectionContext,
  TechnologyDetectionResult,
  TechnologyMeaning,
} from '../contracts';

@Injectable()
export class TechnologyMeaningEngine {
  private readonly logger = new Logger(TechnologyMeaningEngine.name);

  constructor(private readonly registry: TechnologyDetectorRegistryService) {}

  async interpretAll(
    rawResults: TechnologyDetectionResult[],
    context: TechnologyDetectionContext,
  ): Promise<TechnologyDetectionResult[]> {
    const interpretedResults: TechnologyDetectionResult[] = [];

    for (const result of rawResults) {
      try {
        const interpreted = await this.interpret(result, context);
        interpretedResults.push(interpreted);
      } catch (error) {
        this.logger.error(
          `Failed to interpret meaning for technology '${result.id}':`,
          error instanceof Error ? error.stack : String(error),
        );
        // Fallback: preserve existing detection result if meaning generation throws
        interpretedResults.push(result);
      }
    }

    return interpretedResults;
  }

  async interpret(
    result: TechnologyDetectionResult,
    context: TechnologyDetectionContext,
  ): Promise<TechnologyDetectionResult> {
    const detector = this.registry.get(result.id);

    let meaning: Partial<TechnologyMeaning> = {};

    if (detector && typeof detector.interpret === 'function') {
      try {
        meaning = await detector.interpret(result, context);
      } catch (err) {
        this.logger.warn(
          `Detector '${detector.id}' custom interpret() threw an error, using fallback meaning: ${err}`,
        );
      }
    }

    const isBehavioralOnly = (result as any).behavioralPosture === 'CONSISTENT';

    const whyDetected =
      isBehavioralOnly && result.whyDetected
        ? result.whyDetected
        : meaning.whyDetected ||
          result.whyDetected ||
          this.synthesizeWhyDetected(result);

    const role =
      meaning.role ||
      result.role ||
      detector?.role ||
      'Identified Infrastructure Component';

    const infrastructureMeaning =
      meaning.infrastructureMeaning ||
      result.infrastructureMeaning ||
      detector?.infrastructureMeaning ||
      `The public endpoint exhibits characteristics of ${result.name}.`;

    const whatThisDoesNotProve =
      isBehavioralOnly && result.whatThisDoesNotProve
        ? result.whatThisDoesNotProve
        : meaning.whatThisDoesNotProve ||
          result.whatThisDoesNotProve ||
          detector?.whatThisDoesNotProve ||
          this.synthesizeBoundary(result);

    const implications = meaning.implications ||
      result.implications ||
      detector?.defaultImplications || [
        `${result.name} actively participates in the public infrastructure path.`,
        `Configuration and telemetry are verifiable from public network observations.`,
      ];

    const description =
      result.description ||
      detector?.description ||
      `${result.name} infrastructure component`;

    return {
      ...result,
      behavioralPosture: (result as any).behavioralPosture,
      behavioralSignals: (result as any).behavioralSignals,
      description,
      whyDetected,
      role,
      infrastructureMeaning,
      whatThisDoesNotProve,
      implications,
    };
  }

  private synthesizeWhyDetected(result: TechnologyDetectionResult): string {
    if (result.evidence && result.evidence.length > 0) {
      const items = result.evidence.map((e) => {
        if (e.observedValue && e.observedValue !== e.indicator) {
          return `${e.source} ('${e.observedValue}')`;
        }
        return `${e.source} (${e.indicator})`;
      });

      if (items.length === 1) {
        return `Observed ${items[0]}.`;
      }
      if (items.length === 2) {
        return `Observed ${items[0]} and ${items[1]}.`;
      }
      return `Observed correlated telemetry across ${items.slice(0, 3).join(', ')}.`;
    }

    return `Identified matching telemetry signatures for ${result.name}.`;
  }

  private synthesizeBoundary(result: TechnologyDetectionResult): string {
    return `Observed signals confirm the presence of ${result.name} in the endpoint communication path, but do not prove underlying origin server location or unobserved infrastructure components.`;
  }
}
