import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
import type { Repository } from "typeorm";
import {
	EquipmentTypeEntity,
	EquipmentTypeMapper,
} from "./equipment-type.entity";

@Injectable()
export class EquipmentTypeRepository {
	constructor(
    @InjectRepository(EquipmentTypeEntity)
    private readonly repository: Repository<EquipmentTypeEntity>
  ) {}

	async save(type: EquipmentType): Promise<void> {
		await this.repository.save(EquipmentTypeMapper.toEntity(type));
	}

	async findById(id: string): Promise<EquipmentType | null> {
		const entity = await this.repository.findOneBy({ id });
		return entity ? EquipmentTypeMapper.toDomain(entity) : null;
	}

	async findByCategoryId(categoryId: string): Promise<EquipmentType[]> {
		const entities = await this.repository.findBy({ categoryId });
		return entities.map(EquipmentTypeMapper.toDomain);
	}
}
