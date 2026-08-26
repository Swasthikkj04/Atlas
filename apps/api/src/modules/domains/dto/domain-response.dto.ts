export class DomainResponseDto {
  id: string;
  domainName: string;
  monitoringEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
  lastUnderstoodAt?: Date | null;
  understandingStatus?: string | null;
}
