export class SnapshotDetailDto {
  id: string;

  domainId: string;

  createdAt: Date;

  responseTimeMs: number;

  httpStatus: number;

  payload: unknown;
}