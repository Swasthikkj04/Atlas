import { Injectable } from '@nestjs/common';
import { ExplorerQueryDto } from '../dto/explorer-query.dto';
import { ExplorerRepository } from '../repositories/explorer.repository';

@Injectable()
export class InfrastructureExplorerQueryService {
  constructor(private readonly explorerRepository: ExplorerRepository) {}

  async getUserAssets(userId: string, query: ExplorerQueryDto) {
    return this.explorerRepository.findUserAssets(userId, query);
  }

  async getAssetById(userId: string, assetId: string) {
    return this.explorerRepository.findAssetById(userId, assetId);
  }

  async findRawEvidenceForUser(userId: string) {
    return this.explorerRepository.findRawEvidenceForUser(userId);
  }

  async findTimelineForUser(userId: string) {
    return this.explorerRepository.findTimelineForUser(userId);
  }

  async findFindingsForUser(userId: string) {
    return this.explorerRepository.findFindingsForUser(userId);
  }
}
