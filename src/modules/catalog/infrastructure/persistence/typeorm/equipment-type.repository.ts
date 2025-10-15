import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  EquipmentTypeMapper,
  EquipmentTypeEntity,
} from "./equipment-type.entity";
import { Repository } from "typeorm";
import { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";

@Injectable()
export class EquipmentTypeRepository {
  constructor(
    @InjectRepository(EquipmentTypeEntity)
    private readonly repository: Repository<EquipmentTypeEntity>
  ) {}

  async save(type: EquipmentType): Promise<void> {
    await this.repository.save(EquipmentTypeMapper.toEntity(type));
  }

  /* ---------- read ---------- */
  async findById(id: string): Promise<EquipmentType | null> {
    const raw = await this.repository.findOneBy({ id });
    return raw ? EquipmentTypeMapper.toDomain(raw) : null;
  }

  async findByCategoryId(categoryId: string): Promise<EquipmentType[]> {
    const raws = await this.repository.findBy({ categoryId });
    return raws.map(EquipmentTypeMapper.toDomain);
  }
}
