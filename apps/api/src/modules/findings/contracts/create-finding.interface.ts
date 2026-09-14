import { FindingCategory } from '../enums/finding-category.enum';
import { Severity } from '../enums/severity.enum';
import { Recommendation } from './recommendation.interface';
import {
  FindingConfidence,
  RiskClassification,
} from './finding-result.interface';

export interface CreateFinding {
  ruleId: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: Severity;
  confidence?: FindingConfidence;
  riskClassification?: RiskClassification;
  severityRationale?: string;
  whatThisDoesNotProve?: string;
  recommendations?: Recommendation[];
}
