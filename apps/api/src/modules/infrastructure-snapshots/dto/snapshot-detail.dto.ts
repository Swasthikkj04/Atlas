export class SnapshotDetailDto {
  id: string;

  domainId: string;

  domainName?: string;

  createdAt: Date;

  responseTimeMs: number;

  httpStatus: number;

  payload: unknown;
}
