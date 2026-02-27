import { TrackingType } from '@repo/types';
import { Product } from '../entities/product.entity';
import { IncludedItem } from '../value-objects/included-item';
import { PaginationMeta } from '@repo/schemas';

export abstract class ProductRepositoryPort {
  abstract findTrackingType(id: string): Promise<TrackingType | null>;
  abstract findAllWithCategory(filters: FindAllWithCategoryFilters): Promise<PaginatedProducts>;
  abstract save(product: Product): Promise<string>;
}

export interface FindAllWithCategoryFilters {
  categoryId?: string;
  trackingType?: TrackingType;
  page: number;
  limit: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  trackingType: TrackingType;
  attributes: Record<string, unknown>;
  includedItems: IncludedItem[];
  category: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProducts {
  data: ProductListItem[];
  meta: PaginationMeta;
}
