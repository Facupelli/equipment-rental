import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  EquipmentTypeMapper,
  EquipmentTypeSchema,
} from "./equipment-type.schema";
import { Repository } from "typeorm";
import { EquipmentType } from "src/modules/catalog/domain/entities/equipment-type.entity";
import { EquipmentTypeId } from "src/modules/catalog/domain/value-objects/equipment-type-id.vo";
import { CategoryId } from "src/modules/catalog/domain/value-objects/category-id.vo";

@Injectable()
export class EquipmentTypeRepository {
  constructor(
    @InjectRepository(EquipmentTypeSchema)
    private readonly repository: Repository<EquipmentTypeSchema>
  ) {}

  async save(type: EquipmentType): Promise<void> {
    await this.repository.save(EquipmentTypeMapper.toPersistence(type));
  }

  /* ---------- read ---------- */
  async findById(id: EquipmentTypeId): Promise<EquipmentType | null> {
    const raw = await this.repository.findOneBy({ id: id.value });
    return raw ? EquipmentTypeMapper.toDomain(raw) : null;
  }

  async findByCategoryId(categoryId: CategoryId): Promise<EquipmentType[]> {
    const raws = await this.repository.findBy({ categoryId: categoryId.value });
    return raws.map(EquipmentTypeMapper.toDomain);
  }
}
