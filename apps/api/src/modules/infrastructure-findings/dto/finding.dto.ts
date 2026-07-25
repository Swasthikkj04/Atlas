export class FindingDto {
  id: string;

  title: string;

  description: string;

  severity: string;

  category: string;

  recommendations?: unknown;

  createdAt: Date;
}