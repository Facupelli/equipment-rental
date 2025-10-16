import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
// biome-ignore lint: /style/useImportType
import { EquipmentTypeRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/equipment-type.repository";
import { v4 as uuidv4 } from "uuid";
import { CreateEquipmentTypeCommand } from "./create-equipment-type.command";

@CommandHandler(CreateEquipmentTypeCommand)
export class CreateEquipmentTypeHandler
	implements ICommandHandler<CreateEquipmentTypeCommand, string>
{
	constructor(
		private readonly equipmentTypeRepository: EquipmentTypeRepository,
	) {}

	async execute(command: CreateEquipmentTypeCommand): Promise<string> {
		const equipmentType = new EquipmentType({
			id: uuidv4(),
			name: command.name,
			description: command.description,
			categoryId: command.categoryId,
			bufferDays: 0,
		});

		await this.equipmentTypeRepository.save(equipmentType);
		return equipmentType.id;
	}
}
