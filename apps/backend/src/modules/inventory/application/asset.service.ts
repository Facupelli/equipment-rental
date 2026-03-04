import { Injectable } from '@nestjs/common';
import { AssetRepositoryPort } from '../domain/ports/asset.repository.port';
import { Asset } from '../domain/entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly assetRepository: AssetRepositoryPort) {}

  async create(dto: CreateAssetDto): Promise<string> {
    const item = Asset.create(dto);

    return await this.assetRepository.save(item);
  }
}
