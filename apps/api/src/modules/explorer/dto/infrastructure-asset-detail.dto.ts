import { ApiProperty } from '@nestjs/swagger';
import { HistoricalPresenceDto } from './historical-presence.dto';
import { InfrastructureAssetDto } from './infrastructure-asset.dto';
import { InfrastructureRelationshipDto } from './infrastructure-relationship.dto';

export class InfrastructureAssetDetailDto {
  @ApiProperty({ type: InfrastructureAssetDto })
  asset!: InfrastructureAssetDto;

  @ApiProperty({ example: { name: 'gws', category: 'web-server' }, description: 'Current parsed value object.' })
  currentValue!: any;

  @ApiProperty({ type: HistoricalPresenceDto })
  historicalPresence!: HistoricalPresenceDto;

  @ApiProperty({ example: [], description: 'Raw evidence artifacts backing this asset.' })
  evidence!: any[];

  @ApiProperty({ example: [], description: 'Canonical observations evaluated for this asset.' })
  observations!: any[];

  @ApiProperty({ example: [], description: 'Findings related to this asset.' })
  relatedFindings!: any[];

  @ApiProperty({ example: [], description: 'Timeline change events related to this asset.' })
  relatedTimelineEvents!: any[];

  @ApiProperty({ type: [InfrastructureRelationshipDto], description: 'Knowledge Graph connected assets.' })
  relationships!: InfrastructureRelationshipDto[];
}
