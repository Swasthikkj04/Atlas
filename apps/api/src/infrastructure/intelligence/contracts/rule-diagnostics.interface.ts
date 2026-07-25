export interface RuleDiagnostics {
  evaluatedRules: number;
  matchedFindings: number;
  unknownStates: number;
  skippedRules: number;
  executionDurationMs: number;
}
