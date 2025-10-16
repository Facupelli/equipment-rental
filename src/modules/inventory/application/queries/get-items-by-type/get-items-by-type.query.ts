import type { IQuery } from "@nestjs/cqrs";

export class GetEquipmentItemsByTypeQuery implements IQuery {
	constructor(readonly equipmentTypeId: string) {}
}
