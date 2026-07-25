import { FindingModule } from '@prisma/client';
import { FindingCategory } from '../enums/finding-category.enum';
import { Severity } from '../enums/severity.enum';
import { Recommendation } from './recommendation.interface';

export interface FindingResult {
  ruleId: string;
  module?: FindingModule;
  title: string;
  description: string;
  category: FindingCategory;
  severity: Severity;
  recommendations: Recommendation[];
}