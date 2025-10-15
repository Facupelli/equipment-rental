import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CategoryMapper, CategoryEntity } from "./category.entity";
import { Repository } from "typeorm";
import { Category } from "src/modules/catalog/domain/models/category.model";

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>
  ) {}

  async save(category: CategoryEntity): Promise<void> {
    const schema = CategoryMapper.toEntity(category);
    await this.repository.save(schema);
  }

  async findById(id: string): Promise<Category | null> {
    const raw = await this.repository.findOneBy({ id });
    return raw ? CategoryMapper.toDomain(raw) : null;
  }

  async exists(id: string): Promise<boolean> {
    return await this.repository.exists({ where: { id } });
  }

  async findAll(): Promise<Category[]> {
    const raws = await this.repository.find({ order: { name: "ASC" } });
    return raws.map(CategoryMapper.toDomain);
  }
}
