import { TrackingMode } from '@repo/types';

export class ProductTypeDto {
  constructor(
    public readonly id: string,
    public readonly trackingMode: TrackingMode,
    public readonly retiredAt: Date | null,
    public readonly publishedAt: Date | null,
  ) {}
}

export class BundleDto {
  constructor(
    public readonly id: string,
    public readonly retiredAt: Date | null,
    public readonly publishedAt: Date | null,
  ) {}
}

export abstract class CatalogPublicApi {
  abstract getProductType(id: string): Promise<ProductTypeDto | null>;
  abstract getBundle(id: string): Promise<BundleDto | null>;
}
