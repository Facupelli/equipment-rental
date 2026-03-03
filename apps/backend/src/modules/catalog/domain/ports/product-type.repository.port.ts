import { ProductType } from '../entities/product-type.entity';

export abstract class ProductTypeRepositoryPort {
  abstract load(id: string): Promise<ProductType | null>;
  abstract save(productType: ProductType): Promise<string>;
}
