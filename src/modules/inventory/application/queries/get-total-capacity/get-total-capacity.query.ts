import type { IQuery } from "@nestjs/cqrs";

export class GetTotalCapacityQuery implements IQuery {
	constructor(public readonly equipmentTypeId: string) {}
}
