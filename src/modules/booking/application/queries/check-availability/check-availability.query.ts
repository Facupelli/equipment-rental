import type { IQuery } from "@nestjs/cqrs";

export class CheckAvailabilityQuery implements IQuery {
	constructor(
		public readonly equipmentTypeId: string,
		public readonly startDateTime: Date,
		public readonly endDateTime: Date,
		public readonly quantity: number,
	) {}
}
