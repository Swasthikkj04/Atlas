import { ApiProperty } from '@nestjs/swagger';

import { TimelineEventDto } from './timeline-event.dto';

export class TimelineResponseDto {
  @ApiProperty({
    description: 'List of timeline change events.',
    type: [TimelineEventDto],
  })
  data!: TimelineEventDto[];

  @ApiProperty({
    description: 'Pagination metadata for cursor pagination.',
  })
  pagination!: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}
