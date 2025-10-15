import { Category } from "src/modules/catalog/domain/models/category.model";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("catalog_categories")
export class CategoryEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;
}

export const CategoryMapper = {
  toDomain(schema: CategoryEntity): Category {
    return new Category({
      id: schema.id,
      name: schema.name,
      description: schema.description,
    });
  },

  toEntity(entity: Category): CategoryEntity {
    const schema = new CategoryEntity();
    schema.id = entity.id;
    schema.name = entity.name;
    schema.description = entity.description;
    return schema;
  },
};
