import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CategoryMapper, CategorySchema } from "./category.schema";
import { Repository } from "typeorm";
import { Category } from "src/modules/catalog/domain/entities/category.entity";

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(CategorySchema)
    private readonly repository: Repository<CategorySchema>
  ) {}

  async save(category: CategorySchema): Promise<void> {
    const schema = CategoryMapper.toSchema(category);
    await this.repository.save(schema);
  }

  async findById(id: string): Promise<Category | null> {
    const raw = await this.repository.findOneBy({ id });
    return raw ? CategoryMapper.toEntity(raw) : null;
  }

  async exists(id: string): Promise<boolean> {
    return await this.repository.exists({ where: { id } });
  }

  async findAll(): Promise<Category[]> {
    const raws = await this.repository.find({ order: { name: "ASC" } });
    return raws.map(CategoryMapper.toEntity);
  }
}
