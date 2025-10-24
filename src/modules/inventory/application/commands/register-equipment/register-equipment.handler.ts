import { ConflictException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { EquipmentItem } from "src/modules/inventory/domain/models/equipment-item.model";
// biome-ignore lint: /style/useImportType
import { EquipmentItemRepository } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.repository";
import { v4 as uuidv4 } from "uuid";
import { RegisterEquipmentCommand } from "./register-equipment.command";

@CommandHandler(RegisterEquipmentCommand)
export class RegisterEquipmentHandler
	implements ICommandHandler<RegisterEquipmentCommand, string>
{
	constructor(
		private readonly equipmentItemRepository: EquipmentItemRepository,
	) {}

	async execute(command: RegisterEquipmentCommand): Promise<string> {
		const { equipmentTypeId, serialNumber } = command;

		const existing =
			await this.equipmentItemRepository.existsSerial(serialNumber);

		if (existing) {
			throw new ConflictException(
				`Equipment with serial number ${serialNumber} already exists`,
			);
		}

		const equipmentItem = EquipmentItem.register(
			uuidv4(),
			equipmentTypeId,
			serialNumber,
		);

		await this.equipmentItemRepository.save(equipmentItem);
		return equipmentItem.id;
	}
}
