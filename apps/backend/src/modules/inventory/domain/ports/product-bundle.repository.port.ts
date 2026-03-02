import { ProductBundle } from '../entities/product-bundle.entity';

export abstract class BundleRepositoryPort {
  abstract save(bundle: ProductBundle): Promise<string>;
  abstract findAll(): Promise<ProductBundle[]>;
}
