import { FindingContext } from './finding-context.interface';
import { FindingResult } from './finding-result.interface';

export interface FindingRule {
  readonly id: string;
  readonly name: string;

  evaluate(context: FindingContext): Promise<FindingResult[]>;
}