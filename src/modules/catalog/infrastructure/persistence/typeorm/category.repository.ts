import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CategoryMapper, CategorySchema } from "./category.schema";
import { Category } from "src/modules/catalog/domain/entities/category.entity";
import { CategoryId } from "src/modules/catalog/domain/value-objects/category-id.vo";
import { Repository } from "typeorm";

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(CategorySchema)
    private readonly repository: Repository<CategorySchema>
  ) {}

  async save(category: Category): Promise<void> {
    const schema = CategoryMapper.toPersistence(category);
    await this.repository.save(schema);
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const raw = await this.repository.findOneBy({ id: id.value });
    return raw ? CategoryMapper.toDomain(raw) : null;
  }

  async exists(id: CategoryId): Promise<boolean> {
    return await this.repository.exist({ where: { id: id.value } });
  }

  async findAll(): Promise<Category[]> {
    const raws = await this.repository.find({ order: { name: "ASC" } });
    return raws.map(CategoryMapper.toDomain);
  }
}
