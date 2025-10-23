import { createZodDto } from "nestjs-zod";
import z from "zod";

export enum GetEquipmentTypesSortBy {
	Created = "created",
	Price = "price",
}

export enum GetEquipmentTypesSortOrder {
	Asc = "ASC",
	Desc = "DESC",
}

const GetEquipmentTypesSchema = z.object({
	categoryId: z.uuid("Invalid Category ID").optional(),
	dateRangeStart: z.coerce.date().optional(),
	dateRangeEnd: z.coerce.date().optional(),
	sortBy: z.enum(GetEquipmentTypesSortBy).optional(),
	sortOrder: z.enum(GetEquipmentTypesSortOrder).optional(),
	page: z.coerce.number().optional(),
	pageSize: z.coerce.number().optional(),
});

export class GetEquipmentTypesDto extends createZodDto(
	GetEquipmentTypesSchema,
) {}

export interface GetEquipmentTypesResponseDto {
	id: string;
	name: string;
	description: string | null;
	categoryId: string;
	bufferDays: number;
	createdAt: Date;
	rateStructure: {
		id: string;
		hourlyRate: number;
		dailyRate: number;
		minimumCharge: number;
		taxPercentage: number;
		effectiveFrom: Date;
		effectiveTo: Date | null;
	} | null;
}
