import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  EquipmentTypeMapper,
  EquipmentTypeSchema,
} from "./equipment-type.schema";
import { Repository } from "typeorm";
import { EquipmentType } from "src/modules/catalog/domain/entities/equipment-type.entity";

@Injectable()
export class EquipmentTypeRepository {
  constructor(
    @InjectRepository(EquipmentTypeSchema)
    private readonly repository: Repository<EquipmentTypeSchema>
  ) {}

  async save(type: EquipmentType): Promise<void> {
    await this.repository.save(EquipmentTypeMapper.toSchema(type));
  }

  /* ---------- read ---------- */
  async findById(id: string): Promise<EquipmentType | null> {
    const raw = await this.repository.findOneBy({ id });
    return raw ? EquipmentTypeMapper.toEntity(raw) : null;
  }

  async findByCategoryId(categoryId: string): Promise<EquipmentType[]> {
    const raws = await this.repository.findBy({ categoryId });
    return raws.map(EquipmentTypeMapper.toEntity);
  }
}
