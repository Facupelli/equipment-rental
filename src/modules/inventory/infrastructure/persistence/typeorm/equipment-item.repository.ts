import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { EquipmentItem } from "src/modules/inventory/domain/models/equipment-item.model";
import type { Repository } from "typeorm";
import {
	EquipmentItemEntity,
	EquipmentItemMapper,
} from "./equipment-item.entity";

@Injectable()
export class EquipmentItemRepository {

	constructor(
    @InjectRepository(EquipmentItemEntity)
    private readonly repository: Repository<EquipmentItemEntity>
  ) {}

	async findByEquipmentTypeId(
		equipmentTypeId: string,
	): Promise<EquipmentItem[]> {
		const equipmentItems = await this.repository
			.createQueryBuilder("item")
			.where("item.equipmentTypeId = :equipmentTypeId", { equipmentTypeId })
			.orderBy("item.createdAt", "DESC")
			.getMany();

		return equipmentItems.map(EquipmentItemMapper.toDomain)
	}

	async existsSerial(serialNumber: string): Promise<boolean> {
		return this.repository.exists({ where: { serialNumber } });
	}

	async save(item: EquipmentItem): Promise<void> {
		const schema = EquipmentItemMapper.toEntity(item);
		await this.repository.save(schema);
	}
}
