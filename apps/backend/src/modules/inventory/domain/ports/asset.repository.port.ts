import { Asset } from '../entities/asset.entity';

export abstract class AssetRepositoryPort {
  abstract load(id: string): Promise<Asset | null>;
  abstract save(asset: Asset): Promise<string>;
}
