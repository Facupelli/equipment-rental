import { ConflictException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import {
	EquipmentItem,
	EquipmentStatus,
} from "src/modules/inventory/domain/models/equipment-item.model";
// biome-ignore lint: /style/useImportType
import { EquipmentItemRepository } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.repository";
import { RegisterEquipmentCommand } from "./register-equipment.command";

@CommandHandler(RegisterEquipmentCommand)
export class RegisterEquipmentHandler
	implements ICommandHandler<RegisterEquipmentCommand, EquipmentItem>
{
	constructor(
		private readonly equipmentItemRepository: EquipmentItemRepository,
	) {}

	async execute(command: RegisterEquipmentCommand): Promise<EquipmentItem> {
		const { equipmentTypeId, serialNumber } = command;

		const existing =
			await this.equipmentItemRepository.existsSerial(serialNumber);

		if (existing) {
			throw new ConflictException(
				`Equipment with serial number ${serialNumber} already exists`,
			);
		}

		const equipmentItem = new EquipmentItem({
			equipmentTypeId,
			serialNumber,
			status: EquipmentStatus.Available,
			version: 0,
		});

		return await this.equipmentItemRepository.save(equipmentItem);
	}
}
