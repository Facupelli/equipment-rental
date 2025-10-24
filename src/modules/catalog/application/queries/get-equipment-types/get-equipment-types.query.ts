import type { IQuery } from "@nestjs/cqrs";
import type {
	GetEquipmentTypesSortBy,
	GetEquipmentTypesSortOrder,
} from "./get-equipment-types.dto";

export class GetEquipmentTypesQuery implements IQuery {
	constructor(
		public readonly categoryId?: string,
		public readonly dateRangeStart?: Date,
		public readonly dateRangeEnd?: Date,
		public readonly sortBy?: GetEquipmentTypesSortBy,
		public readonly sortOrder?: GetEquipmentTypesSortOrder,
		public readonly page?: number,
		public readonly pageSize?: number,
	) {}
}
