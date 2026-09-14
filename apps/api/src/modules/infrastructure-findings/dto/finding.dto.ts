export class FindingDto {
  id: string;

  ruleId?: string;

  title: string;

  description: string;

  severity: string;

  confidence?: string;

  riskClassification?: string;

  severityRationale?: string;

  whatThisDoesNotProve?: string;

  category: string;

  recommendations?: unknown;

  createdAt: Date;
}
