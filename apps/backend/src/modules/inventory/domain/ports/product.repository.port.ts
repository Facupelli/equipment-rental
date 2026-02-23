import { Product } from '../entities/product.entity';

export abstract class ProductRepositoryPort {
  abstract findById(id: string): Promise<Product | null>;
  abstract findAll(): Promise<Product[]>;
  abstract save(product: Product): Promise<string>;
}
