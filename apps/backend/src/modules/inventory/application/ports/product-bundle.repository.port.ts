import { ProductBundle } from '../../domain/entities/product-bundle.entity';

export abstract class BundleRepositoryPort {
  abstract save(bundle: ProductBundle): Promise<string>;
  abstract findAll(): Promise<ProductBundle[]>;
}
