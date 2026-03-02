import { Category } from '../../domain/entities/category.entity';

export abstract class CategoryRepositoryPort {
  abstract findAll(): Promise<Category[]>;
  abstract save(category: Category): Promise<string>;
}
