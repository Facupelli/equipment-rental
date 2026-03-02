import { TrackingType } from '@repo/types';
import { Product } from '../../domain/entities/product.entity';

export abstract class ProductRepositoryPort {
  abstract findTrackingType(id: string): Promise<TrackingType | null>;
  abstract save(product: Product): Promise<string>;
}
