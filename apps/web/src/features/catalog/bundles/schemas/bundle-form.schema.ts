import {
	type BundleDetailResponseDto,
	type CreateBundleDto,
	CreateBundleSchema,
	type UpdateBundleDto,
	UpdateBundleSchema,
} from "@repo/schemas";
import { z } from "zod";
import { emptyToNull, emptyToNullOrUndefined } from "@/shared/utils/form.utils";

const bundleComponentFormSchema = z.object({
	productTypeId: z.uuid("Tipo de producto invalido"),
	quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
	// Display-only fields — present in form state, stripped before DTO mapping.
	name: z.string(),
	subtitle: z.string(),
	// Upper bound for the quantity stepper. Equals the active asset count for
	// this product type at the time it was added to the bundle.
	assetCount: z.number().int().nonnegative(),
});

export const bundleFormSchema = z.object({
	name: z.string().min(1, "El nombre del combo es obligatorio"),
	billingUnitId: z.uuid("La unidad de cobro es obligatoria"),
	imageUrl: z.string().or(z.literal("")),
	description: z.string().or(z.literal("")),
	components: z
		.array(bundleComponentFormSchema)
		.min(1, "Debes agregar al menos un componente"),
});

export type BundleComponentFormValues = z.infer<
	typeof bundleComponentFormSchema
>;
export type BundleFormValues = z.infer<typeof bundleFormSchema>;

export const bundleFormDefaults: BundleFormValues = {
	name: "",
	billingUnitId: "",
	imageUrl: "",
	description: "",
	components: [],
};

export function bundleToFormValues(
	bundle: BundleDetailResponseDto,
): BundleFormValues {
	return {
		name: bundle.name,
		billingUnitId: bundle.billingUnit.id,
		imageUrl: bundle.imageUrl ?? "",
		description: bundle.description ?? "",
		components: bundle.components.map((component) => ({
			productTypeId: component.productTypeId,
			quantity: component.quantity,
			name: component.productType.name,
			subtitle: component.productType.description ?? "",
			assetCount: component.assetCount,
		})),
	};
}

export function toCreateBundleDto(values: BundleFormValues): CreateBundleDto {
	const dto = {
		name: values.name,
		billingUnitId: values.billingUnitId,
		imageUrl: emptyToNull(values.imageUrl),
		description: emptyToNull(values.description),
		// Strip display-only fields — only send what the backend expects.
		components: values.components.map(({ productTypeId, quantity }) => ({
			productTypeId,
			quantity,
		})),
	};

	// Re-validate against the backend schema to guarantee contract alignment.
	return CreateBundleSchema.parse(dto);
}

export function toUpdateBundleDto(
	dirtyValues: Partial<BundleFormValues>,
): UpdateBundleDto {
	const dto: UpdateBundleDto = {};

	if (dirtyValues.name !== undefined) {
		dto.name = dirtyValues.name.trim();
	}

	if (dirtyValues.billingUnitId !== undefined) {
		dto.billingUnitId = dirtyValues.billingUnitId;
	}

	if (dirtyValues.imageUrl !== undefined) {
		dto.imageUrl = emptyToNullOrUndefined(dirtyValues.imageUrl);
	}

	if (dirtyValues.description !== undefined) {
		dto.description = emptyToNullOrUndefined(dirtyValues.description);
	}

	if (dirtyValues.components !== undefined) {
		dto.components = dirtyValues.components.map(
			({ productTypeId, quantity }) => ({
				productTypeId,
				quantity,
			}),
		);
	}

	return UpdateBundleSchema.parse(dto);
}
