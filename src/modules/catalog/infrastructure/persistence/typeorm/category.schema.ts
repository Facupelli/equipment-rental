import { Category } from "src/modules/catalog/domain/entities/category.entity";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("catalog_categories")
export class CategorySchema {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;
}

export const CategoryMapper = {
  toEntity(schema: CategorySchema): Category {
    return new Category({
      id: schema.id,
      name: schema.name,
      description: schema.description,
    });
  },

  toSchema(entity: Category): CategorySchema {
    const schema = new CategorySchema();
    schema.id = entity.id;
    schema.name = entity.name;
    schema.description = entity.description;
    return schema;
  },
};
