import type { ICommand } from "@nestjs/cqrs";

export class RegisterEquipmentCommand implements ICommand {
	constructor(
		public readonly equipmentTypeId: string,
		public readonly currentLocationId: string,
		public readonly serialNumber: string,
	) {}
}
