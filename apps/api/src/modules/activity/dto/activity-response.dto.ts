import { ApiProperty } from '@nestjs/swagger';

import { ActivityItemDto } from './activity-item.dto';

export class ActivityResponseDto {
  @ApiProperty({
    description: 'List of activity feed items.',
    type: [ActivityItemDto],
  })
  data!: ActivityItemDto[];

  @ApiProperty({
    description: 'Pagination metadata for cursor pagination.',
  })
  pagination!: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}
