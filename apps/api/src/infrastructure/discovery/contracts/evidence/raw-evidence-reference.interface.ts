export interface RawEvidenceReference {
  evidenceId: string;
  collectorName: string;
  payloadType: string;
  sizeBytes: number;
  checksumSha256?: string;
  capturedAt: Date;
}
