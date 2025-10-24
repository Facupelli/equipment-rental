import type { ICommand } from "@nestjs/cqrs";

export class UpdateEquipmentTypeCommand implements ICommand {
	constructor(
		public readonly equipmentTypeId: string,
		public readonly description?: string | null,
		public readonly bufferDays?: number,
	) {}
}
