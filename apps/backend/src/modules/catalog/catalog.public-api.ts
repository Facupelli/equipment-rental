import { TrackingMode } from '@repo/types';

export class ProductTypeDto {
  constructor(
    public readonly id: string,
    public readonly trackingMode: TrackingMode,
    public readonly retiredAt: Date | null,
    public readonly publishedAt: Date | null,
  ) {}
}

export class ProductTypeOrderMetaDto {
  constructor(
    public readonly id: string,
    public readonly categoryId: string | null,
  ) {}
}

export class BundleDto {
  constructor(
    public readonly id: string,
    public readonly retiredAt: Date | null,
    public readonly publishedAt: Date | null,
  ) {}
}

export class BundleOrderMetaComponentDto {
  constructor(
    public readonly productTypeId: string,
    public readonly productTypeName: string,
    public readonly quantity: number,
  ) {}
}

export class BundleOrderMetaDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly components: BundleOrderMetaComponentDto[],
  ) {}
}

export abstract class CatalogPublicApi {
  abstract getProductType(id: string): Promise<ProductTypeDto | null>;
  abstract getBundle(id: string): Promise<BundleDto | null>;
  abstract getProductTypeOrderMeta(id: string): Promise<ProductTypeOrderMetaDto | null>;
  abstract getBundleOrderMeta(id: string): Promise<BundleOrderMetaDto | null>;
}
