import { FindingModule } from '@prisma/client';
import { FindingCategory } from '../enums/finding-category.enum';
import { Severity } from '../enums/severity.enum';
import { Recommendation } from './recommendation.interface';

export type FindingConfidence =
  'AUTHORITATIVE' | 'SUPPORTED' | 'CONTEXTUAL' | 'INCONCLUSIVE';

export type RiskClassification =
  | 'CONFIRMED_SECURITY_CONDITION'
  | 'SECURITY_HARDENING_GAP'
  | 'OPERATIONAL_OBSERVATION'
  | 'INFORMATIONAL_OBSERVATION';

export interface FindingResult {
  ruleId: string;
  module?: FindingModule;
  title: string;
  description: string;
  category: FindingCategory;
  severity: Severity;
  confidence?: FindingConfidence;
  riskClassification?: RiskClassification;
  severityRationale?: string;
  whatThisDoesNotProve?: string;
  recommendations: Recommendation[];
}
