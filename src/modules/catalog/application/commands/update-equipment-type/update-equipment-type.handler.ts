import { NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { EquipmentTypeRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/equipment-type.repository";
import { UpdateEquipmentTypeCommand } from "./update-equipment-type.query";

@CommandHandler(UpdateEquipmentTypeCommand)
export class UpdateEquipmentTypeHandler
	implements ICommandHandler<UpdateEquipmentTypeCommand>
{
	constructor(
		private readonly equipmentTypeRepository: EquipmentTypeRepository,
	) {}

	async execute(command: UpdateEquipmentTypeCommand): Promise<void> {
		const { equipmentTypeId, description, bufferDays } = command;

		const equipmentType =
			await this.equipmentTypeRepository.findById(equipmentTypeId);

		if (!equipmentType) {
			throw new NotFoundException(
				`Equipment type with ID ${equipmentTypeId} not found`,
			);
		}

		let hasChanges = false;

		if (description !== undefined) {
			equipmentType.updateDescription(description);
			hasChanges = true;
		}

		if (bufferDays !== undefined) {
			equipmentType.updateBufferDays(bufferDays);
			hasChanges = true;
		}

		if (hasChanges) {
			await this.equipmentTypeRepository.save(equipmentType);
		}
	}
}
