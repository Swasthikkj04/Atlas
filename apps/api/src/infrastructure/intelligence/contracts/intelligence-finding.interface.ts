import { FindingCategory, FindingModule, Severity } from '@prisma/client';

export interface IntelligenceFindingLineage {
  matchedObservations: string[];
  evidenceIds: string[];
  confidence: number;
}

export interface IntelligenceFinding {
  findingId: string;
  ruleId: string;
  ruleVersion: string;
  module: FindingModule;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  lineage: IntelligenceFindingLineage;
  generatedAt: Date;
  state: 'MATCHED' | 'UNKNOWN';
}
