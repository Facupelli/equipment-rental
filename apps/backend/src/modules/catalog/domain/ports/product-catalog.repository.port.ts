import { ProductCategory } from '../entities/product-category.entity';

export abstract class ProductCategoryRepositoryPort {
  abstract load(id: string): Promise<ProductCategory | null>;
  abstract save(productCategory: ProductCategory): Promise<string>;
}
