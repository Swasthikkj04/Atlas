import { FindingContext } from './finding-context.interface';
import { FindingResult } from './finding-result.interface';
import { FindingCategory } from '../enums/finding-category.enum';

export interface FindingRule {
  readonly id: string;

  readonly name: string;

  readonly category: FindingCategory;

  evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]>;
}