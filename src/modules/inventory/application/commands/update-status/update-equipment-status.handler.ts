import { BadRequestException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { EquipmentItemRepository } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.repository";
import { UpdateEquipmentStatusCommand } from "./update-equipment-status.command";
import { StatusUpdateAction } from "./update-equipment-status.dto";

@CommandHandler(UpdateEquipmentStatusCommand)
export class UpdateEquipmentStatusHandler
	implements ICommandHandler<UpdateEquipmentStatusCommand, void>
{
	constructor(
		private readonly equipmentItemRepository: EquipmentItemRepository,
	) {}

	async execute(command: UpdateEquipmentStatusCommand): Promise<void> {
		const equipmentItem = await this.equipmentItemRepository.findById(
			command.equipmentItemId,
		);

		if (!equipmentItem) {
			throw new Error(`Equipment with id ${command.equipmentItemId} not found`);
		}

		switch (command.action) {
			case StatusUpdateAction.MARK_AVAILABLE:
				equipmentItem.markAsAvailable();
				break;

			case StatusUpdateAction.MARK_MAINTENANCE:
				if (!command.reason) {
					throw new BadRequestException(
						"Reason is required when marking equipment for maintenance",
					);
				}
				equipmentItem.markAsInMaintenance(command.reason);
				break;

			case StatusUpdateAction.MARK_LOST:
				if (!command.reason) {
					throw new BadRequestException(
						"Reason is required when marking equipment as lost",
					);
				}
				equipmentItem.markAsLost(command.reason);
				break;

			case StatusUpdateAction.RETIRE:
				if (!command.reason) {
					throw new BadRequestException(
						"Reason is required when retiring equipment",
					);
				}
				equipmentItem.retire(command.reason);
				break;

			default:
				throw new BadRequestException(`Invalid action: ${command.action}`);
		}

		await this.equipmentItemRepository.save(equipmentItem);
	}
}
