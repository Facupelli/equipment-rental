import { TrackingMode } from '@repo/types';

export class ProductTypeDto {
  constructor(
    public readonly id: string,
    public readonly trackingMode: TrackingMode,
  ) {}
}

export abstract class CatalogPublicApi {
  abstract getProductType(id: string): Promise<ProductTypeDto | null>;
}
