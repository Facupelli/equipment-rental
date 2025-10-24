import { Injectable, NotFoundException } from "@nestjs/common";
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

	async findById(
		equipmentItemId: string,
	): Promise<EquipmentItem> {
		const equipmentItem = await this.repository
			.createQueryBuilder("item")
			.where("item.id = :equipmentItemId", { equipmentItemId })
			.getOne();

		if(!equipmentItem){
			throw new NotFoundException(`Equipment with id ${equipmentItemId} not found`);
		}
		
		return EquipmentItemMapper.toDomain(equipmentItem);
	}

	async findAllByTypeId(
		equipmentTypeId: string,
	): Promise<EquipmentItem[]> {
		const equipmentItems = await this.repository
			.createQueryBuilder("item")
			.where("item.equipment_type_id = :equipmentTypeId", { equipmentTypeId })
			.orderBy("item.created_at", "DESC")
			.getMany();

		return equipmentItems.map(EquipmentItemMapper.toDomain)
	}

	async existsSerial(serialNumber: string): Promise<boolean> {
		return this.repository.exists({ where: { serial_number: serialNumber } });
	}

	async getTotalByTypeId(equipmentTypeId: string): Promise<number> {
		const result = await this.repository.createQueryBuilder()
			.select("COUNT(DISTINCT item.id)", "count")
			.from("inventory.equipment_items", "item")
			.where("item.equipment_type_id = :equipmentTypeId", { equipmentTypeId })
			.getRawOne();

		return parseInt(result.count, 10);
	}

	async save(item: EquipmentItem): Promise<void> {
		const schema = EquipmentItemMapper.toEntity(item);
		await this.repository.save(schema);
	}
}
