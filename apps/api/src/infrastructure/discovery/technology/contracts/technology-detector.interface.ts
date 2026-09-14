import { TechnologyCategory } from './technology-category.enum';
import { TechnologyDetectionContext } from './technology-detection-context.interface';
import { TechnologyDetectionResult } from './technology-detection-result.interface';
import { TechnologyMeaning } from './technology-meaning.interface';

export interface TechnologyDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: TechnologyCategory | string;
  readonly description: string;
  readonly role: string;
  readonly infrastructureMeaning: string;
  readonly detectionSignals: string[];
  readonly confidenceRules: string;
  readonly whatThisDoesNotProve?: string;
  readonly defaultImplications?: string[];
}

export interface TechnologyDetector extends TechnologyDefinition {
  detect(
    context: TechnologyDetectionContext,
  ):
    | TechnologyDetectionResult
    | null
    | Promise<TechnologyDetectionResult | null>;

  interpret?(
    result: TechnologyDetectionResult,
    context: TechnologyDetectionContext,
  ): TechnologyMeaning | Promise<TechnologyMeaning>;
}
