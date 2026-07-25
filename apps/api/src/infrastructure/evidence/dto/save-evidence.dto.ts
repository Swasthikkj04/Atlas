import { EvidenceCategory } from '@prisma/client';

export interface SaveEvidenceDto {
  domainId: string;
  snapshotId?: string;
  collectorName: string;
  collectorVersion: string;
  category?: EvidenceCategory;
  payloadType: string;
  target: string;
  payload: string | Record<string, any>;
  capturedAt?: Date;
  compress?: boolean;

  // Provenance fields
  requestMethod?: string;
  responseStatus?: number;
  redirectIndex?: number;
  sourceEndpoint?: string;
  targetEndpoint?: string;
  protocolVersion?: string;
  transportProtocol?: string;
}
