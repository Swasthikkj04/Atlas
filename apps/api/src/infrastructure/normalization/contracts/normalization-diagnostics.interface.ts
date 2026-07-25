export interface NormalizationDiagnostics {
  warnings: string[];
  unsupportedFields: string[];
  partialNormalizations: string[];
  unknownValues: string[];
  executionTimeMs: number;
}
