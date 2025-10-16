import { CommandHandler } from "@nestjs/cqrs";
import { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
// biome-ignore lint: /style/useImportType
import { EquipmentTypeRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/equipment-type.repository";
import { CreateEquipmentTypeCommand } from "./create-equipment-type.command";

@CommandHandler(CreateEquipmentTypeCommand)
export class CreateEquipmentTypeHandler {
	constructor(
		private readonly equipmentTypeRepository: EquipmentTypeRepository,
	) {}

	async execute(command: CreateEquipmentTypeCommand): Promise<EquipmentType> {
		const equipmentType = new EquipmentType({
			name: command.name,
			description: command.description,
			categoryId: command.categoryId,
			bufferDays: 0,
		});

		return await this.equipmentTypeRepository.save(equipmentType);
	}
}
