import { TrackingType } from '@repo/types';
import { Product } from '../entities/product.entity';

export abstract class ProductRepositoryPort {
  abstract findTrackingType(id: string): Promise<TrackingType | null>;
  abstract findAll(): Promise<Product[]>;
  abstract save(product: Product): Promise<string>;
}
