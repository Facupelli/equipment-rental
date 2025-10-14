import { Category } from "src/modules/catalog/domain/entities/category.entity";
import { CategoryId } from "src/modules/catalog/domain/value-objects/category-id.vo";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("catalog_categories")
export class CategorySchema {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "uuid", nullable: true })
  parentId!: string | null;
}

export const CategoryMapper = {
  toDomain(raw: CategorySchema): Category {
    return Category.create(
      CategoryId.fromString(raw.id),
      raw.name,
      raw.description,
      raw.parentId ? CategoryId.fromString(raw.parentId) : null
    );
  },

  toPersistence(entity: Category): CategorySchema {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      parentId: entity.parentId?.value ?? null,
    };
  },
};
