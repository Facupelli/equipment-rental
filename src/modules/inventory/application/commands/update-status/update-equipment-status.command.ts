import type { ICommand } from "@nestjs/cqrs";
import type { StatusUpdateAction } from "./update-equipment-status.dto";

export class UpdateEquipmentStatusCommand implements ICommand {
	constructor(
		public readonly equipmentItemId: string,
		public readonly action: StatusUpdateAction,
		public readonly reason?: string,
	) {}
}
