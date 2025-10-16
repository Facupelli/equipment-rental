import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
	type EquipmentItem,
	EquipmentStatus,
} from "src/modules/inventory/domain/models/equipment-item.model";
import type {  Repository } from "typeorm";
import {
	EquipmentItemEntity,
	EquipmentItemMapper,
} from "./equipment-item.entity";

@Injectable()
export class EquipmentItemRepository {
	private readonly logger = new Logger(EquipmentItemRepository.name);

	constructor(
    @InjectRepository(EquipmentItemEntity)
    private readonly repository: Repository<EquipmentItemEntity>
  ) {}


	async findAvailableByType(
		equipmentTypeId: string,
		quantity: number,
	): Promise<EquipmentItem[]> {
		const schemas = await this.repository.find({
			where: {
				equipmentTypeId,
				status: EquipmentStatus.Available,
			},
			take: quantity,
			order: {
				createdAt: "ASC", // FIFO: allocate oldest items first
			},
		});

		return schemas.map(EquipmentItemMapper.toDomain);
	}

	async findByReservationId(
		reservationId: string,
	): Promise<EquipmentItem[]> {
		const schemas = await this.repository.find({});
		return schemas.map(EquipmentItemMapper.toDomain);
	}

	async existsSerial(serialNumber: string): Promise<boolean> {
		return this.repository.exists({ where: { serialNumber } });
	}

	async save(item: EquipmentItem, ): Promise<EquipmentItem> {
		const schema = EquipmentItemMapper.toEntity(item);
		const saved =	await this.repository.save(schema);
		return EquipmentItemMapper.toDomain(saved);
	}

	async saveMany(
		items: EquipmentItemEntity[],
	): Promise<void> {
		const entities = items.map(EquipmentItemMapper.toEntity);
		await this.repository.save(entities);
	}

	async countAvailableByType(
		equipmentTypeId: string,
	): Promise<number> {
		
		return this.repository.count({
			where: {
				equipmentTypeId,
				status: EquipmentStatus.Available,
			},
		});
	}
}
