import {
	type CreateBlackoutAssignmentsDto,
	type CreateMaintenanceAssignmentsDto,
	createBlackoutAssignmentsSchema,
	createMaintenanceAssignmentsSchema,
} from "@repo/schemas";
import { z } from "zod";
import dayjs from "@/lib/dates/dayjs";

export const assetAssignmentFormSchema = z
	.object({
		startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
		endDate: z.string().min(1, "La fecha de fin es obligatoria"),
		reason: z.string(),
	})
	.refine(
		(values) =>
			new Date(values.endDate).getTime() >=
			new Date(values.startDate).getTime(),
		{
			message:
				"La fecha de fin debe ser igual o posterior a la fecha de inicio",
			path: ["endDate"],
		},
	);

export type AssetAssignmentFormValues = z.infer<
	typeof assetAssignmentFormSchema
>;

export function getAssetAssignmentFormDefaults(): AssetAssignmentFormValues {
	const startDate = dayjs().startOf("hour");
	const endDate = startDate.add(1, "hour");

	return {
		startDate: startDate.format("YYYY-MM-DDTHH:mm"),
		endDate: endDate.format("YYYY-MM-DDTHH:mm"),
		reason: "",
	};
}

export function toCreateBlackoutAssignmentsDto(
	values: AssetAssignmentFormValues,
	assetIds: string[],
): CreateBlackoutAssignmentsDto {
	return createBlackoutAssignmentsSchema.parse({
		assetIds,
		startDate: new Date(values.startDate),
		endDate: new Date(values.endDate),
		reason: toNullableReason(values.reason),
	});
}

export function toCreateMaintenanceAssignmentsDto(
	values: AssetAssignmentFormValues,
	assetIds: string[],
): CreateMaintenanceAssignmentsDto {
	return createMaintenanceAssignmentsSchema.parse({
		assetIds,
		startDate: new Date(values.startDate),
		endDate: new Date(values.endDate),
		reason: toNullableReason(values.reason),
	});
}

function toNullableReason(value: string): string | null {
	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}
