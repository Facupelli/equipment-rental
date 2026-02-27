import { TrackingType } from '@repo/types';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';

export abstract class ProductRepositoryPort {
  abstract findTrackingType(id: string): Promise<TrackingType | null>;
  abstract findAllWithCategory(filters: findAllWithCategoryFilters): Promise<ProductsWithCategory>;
  abstract save(product: Product): Promise<string>;
}

export interface findAllWithCategoryFilters {
  categoryId?: string;
}
export type ProductsWithCategory = { product: Product; category: Category | null }[];
